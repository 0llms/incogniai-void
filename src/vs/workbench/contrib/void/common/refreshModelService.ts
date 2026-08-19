/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { IVoidSettingsService } from './voidSettingsService.js';
import { ILLMMessageService } from './sendLLMMessageService.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { Disposable, IDisposable } from '../../../../base/common/lifecycle.js';
import { RefreshableProviderName, refreshableProviderNames, SettingsOfProvider } from './voidSettingsTypes.js';
import { OpenaiCompatibleModelResponse } from './sendLLMMessageTypes.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';


type RefreshableState = ({
	state: 'init',
	timeoutId: null,
} | {
	state: 'refreshing',
	timeoutId: NodeJS.Timeout | null,
} | {
	state: 'finished',
	timeoutId: null,
} | {
	state: 'error',
	timeoutId: null,
})

export type RefreshModelStateOfProvider = Record<RefreshableProviderName, RefreshableState>

const refreshBasedOn: { [k in RefreshableProviderName]: (keyof SettingsOfProvider[k])[] } = {
	incogniAI: ['_didFillInProviderSettings', 'endpoint', 'apiKey'],
}
const REFRESH_INTERVAL = 5_000

const autoOptions = { enableProviderOnSuccess: true, doNotFire: true }

function eq<T>(a: T[], b: T[]): boolean {
	if (a.length !== b.length) return false
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false
	}
	return true
}

export interface IRefreshModelService {
	readonly _serviceBrand: undefined;
	startRefreshingModels: (providerName: RefreshableProviderName, options: { enableProviderOnSuccess: boolean, doNotFire: boolean }) => void;
	onDidChangeState: Event<RefreshableProviderName>;
	state: RefreshModelStateOfProvider;
}

export const IRefreshModelService = createDecorator<IRefreshModelService>('RefreshModelService');

export class RefreshModelService extends Disposable implements IRefreshModelService {

	readonly _serviceBrand: undefined;

	private readonly _onDidChangeState = new Emitter<RefreshableProviderName>();
	readonly onDidChangeState: Event<RefreshableProviderName> = this._onDidChangeState.event;

	constructor(
		@IVoidSettingsService private readonly voidSettingsService: IVoidSettingsService,
		@ILLMMessageService private readonly llmMessageService: ILLMMessageService,
	) {
		super()

		const disposables: Set<IDisposable> = new Set()

		const initializeAutoPollingAndOnChange = () => {
			this._clearAllTimeouts()
			disposables.forEach(d => d.dispose())
			disposables.clear()

			if (!voidSettingsService.state.globalSettings.autoRefreshModels) return

			for (const providerName of refreshableProviderNames) {
				this.startRefreshingModels(providerName, autoOptions)

				let relevantVals = () => refreshBasedOn[providerName].map(settingName => voidSettingsService.state.settingsOfProvider[providerName][settingName])
				let prevVals = relevantVals()
				disposables.add(
					voidSettingsService.onDidChangeState(() => {
						const newVals = relevantVals()
						if (!eq(prevVals, newVals)) {
							const prevEnabled = prevVals[0] as boolean
							const enabled = newVals[0] as boolean
							if ((enabled && !prevEnabled) || (!enabled && !prevEnabled)) {
								this.startRefreshingModels(providerName, autoOptions)
							}
							prevVals = newVals
						}
					})
				)
			}
		}

		voidSettingsService.waitForInitState.then(() => {
			initializeAutoPollingAndOnChange()
			this._register(
				voidSettingsService.onDidChangeState((type) => { if (typeof type === 'object' && type[1] === 'autoRefreshModels') initializeAutoPollingAndOnChange() })
			)
		})
	}

	state: RefreshModelStateOfProvider = {
		incogniAI: { state: 'init', timeoutId: null },
	}

	startRefreshingModels: IRefreshModelService['startRefreshingModels'] = (providerName, options) => {
		this._clearProviderTimeout(providerName)
		this._setRefreshState(providerName, 'refreshing', options)

		const autoPoll = () => {
			if (this.voidSettingsService.state.globalSettings.autoRefreshModels) {
				const timeoutId = setTimeout(() => this.startRefreshingModels(providerName, autoOptions), REFRESH_INTERVAL)
				this._setTimeoutId(providerName, timeoutId)
			}
		}

		const listFn = this.llmMessageService.openAICompatibleList

		listFn({
			providerName,
			onSuccess: ({ models }) => {
				this.voidSettingsService.setAutodetectedModels(
					providerName,
					models.map(model => (model as OpenaiCompatibleModelResponse).id),
					{ enableProviderOnSuccess: options.enableProviderOnSuccess, hideRefresh: options.doNotFire }
				)
				if (options.enableProviderOnSuccess) this.voidSettingsService.setSettingOfProvider(providerName, '_didFillInProviderSettings', true)
				this._setRefreshState(providerName, 'finished', options)
				autoPoll()
			},
			onError: ({ error }) => {
				this._setRefreshState(providerName, 'error', options)
				autoPoll()
			}
		})
	}

	_clearAllTimeouts() {
		for (const providerName of refreshableProviderNames) {
			this._clearProviderTimeout(providerName)
		}
	}

	_clearProviderTimeout(providerName: RefreshableProviderName) {
		if (this.state[providerName].timeoutId) {
			clearTimeout(this.state[providerName].timeoutId)
			this._setTimeoutId(providerName, null)
		}
	}

	private _setTimeoutId(providerName: RefreshableProviderName, timeoutId: NodeJS.Timeout | null) {
		this.state[providerName].timeoutId = timeoutId
	}

	private _setRefreshState(providerName: RefreshableProviderName, state: RefreshableState['state'], options?: { doNotFire: boolean }) {
		if (options?.doNotFire) return
		this.state[providerName].state = state
		this._onDidChangeState.fire(providerName)
	}
}

registerSingleton(IRefreshModelService, RefreshModelService, InstantiationType.Eager);
