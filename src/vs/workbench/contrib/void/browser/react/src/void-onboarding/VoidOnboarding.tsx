/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { useEffect, useState } from 'react';
import { useAccessor, useIsDark, useSettingsState } from '../util/services.js';
import { Brain, Check, ChevronRight, ExternalLink, Lock, Shield, Sparkles, Zap } from 'lucide-react';
import { displayInfoOfProviderName, ProviderName, providerNames, localProviderNames, FeatureName, isFeatureNameDisabled } from '../../../../common/voidSettingsTypes.js';
import { OllamaSetupInstructions, OneClickSwitchButton, SettingsForProvider, ModelDump } from '../void-settings-tsx/Settings.js';
import ErrorBoundary from '../sidebar-tsx/ErrorBoundary.js';

const OVERRIDE_VALUE = false

export const VoidOnboarding = () => {

	const voidSettingsState = useSettingsState()
	const isOnboardingComplete = voidSettingsState.globalSettings.isOnboardingComplete || OVERRIDE_VALUE

	const isDark = useIsDark()

	return (
		<div className={`@@void-scope ${isDark ? 'dark' : ''}`}>
			<div
				className={`
					bg-[#070709] text-slate-100 fixed top-0 right-0 bottom-0 left-0 width-full z-[99999]
					transition-all duration-1000 ${isOnboardingComplete ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}
				`}
				style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
			>
				<ErrorBoundary>
					<VoidOnboardingContent />
				</ErrorBoundary>
			</div>
		</div>
	)
}

const IncogniAILogo = () => {
	return (
		<div className="flex flex-col items-center justify-center gap-3 my-4">
			<div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 p-1 shadow-[0_0_35px_rgba(99,102,241,0.5)] animate-pulse">
				<div className="w-full h-full bg-[#070709] rounded-xl flex items-center justify-center">
					<Sparkles className="w-9 h-9 text-indigo-400" />
				</div>
			</div>
			<div className="text-center">
				<div className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
					<span>IncogniAI</span>
					<span className="text-indigo-400 text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 font-mono">IDE</span>
				</div>
				<p className="text-xs text-slate-400 mt-1 font-mono">Privacy-First AI Code Editor</p>
			</div>
		</div>
	);
};

const FADE_DURATION_MS = 1000

const FadeIn = ({ children, className, delayMs = 0, durationMs, ...props }: { children: React.ReactNode, delayMs?: number, durationMs?: number, className?: string } & React.HTMLAttributes<HTMLDivElement>) => {

	const [opacity, setOpacity] = useState(0)

	const effectiveDurationMs = durationMs ?? FADE_DURATION_MS

	useEffect(() => {
		const timeout = setTimeout(() => {
			setOpacity(1)
		}, delayMs)

		return () => clearTimeout(timeout)
	}, [setOpacity, delayMs])

	return (
		<div className={className} style={{ opacity, transition: `opacity ${effectiveDurationMs}ms ease-in-out` }} {...props}>
			{children}
		</div>
	)
}

// Onboarding

const tabNames = ['Free', 'Paid', 'Local'] as const;

type TabName = typeof tabNames[number] | 'Cloud/Other';

// Data for cloud providers tab
const cloudProviders: ProviderName[] = ['googleVertex', 'liteLLM', 'microsoftAzure', 'awsBedrock', 'openAICompatible'];

// Data structures for provider tabs
const providerNamesOfTab: Record<TabName, ProviderName[]> = {
	Free: ['gemini', 'openRouter'],
	Local: localProviderNames,
	Paid: providerNames.filter(pn => !(['gemini', 'openRouter', ...localProviderNames, ...cloudProviders] as string[]).includes(pn)) as ProviderName[],
	'Cloud/Other': cloudProviders,
};

const descriptionOfTab: Record<TabName, string> = {
	Free: `Providers with a 100% free tier. Add as many as you'd like!`,
	Paid: `Connect directly with any provider (bring your own API key).`,
	Local: `Active local models (Ollama, LM Studio) are detected automatically.`,
	'Cloud/Other': `Add enterprise cloud endpoint options for your workflow.`,
};

const featureNameMap: { display: string, featureName: FeatureName }[] = [
	{ display: 'Chat', featureName: 'Chat' },
	{ display: 'Quick Edit (Ctrl+K)', featureName: 'Ctrl+K' },
	{ display: 'Autocomplete', featureName: 'Autocomplete' },
	{ display: 'Fast Apply', featureName: 'Apply' },
	{ display: 'Source Control', featureName: 'SCM' },
];

const AddProvidersPage = ({ pageIndex, setPageIndex }: { pageIndex: number, setPageIndex: (index: number) => void }) => {
	const [currentTab, setCurrentTab] = useState<TabName>('Free');
	const settingsState = useSettingsState();
	const accessor = useAccessor();
	const voidSettingsService = accessor.get('IVoidSettingsService');
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		let timeoutId: NodeJS.Timeout | null = null;

		if (errorMessage) {
			timeoutId = setTimeout(() => {
				setErrorMessage(null);
			}, 5000);
		}

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [errorMessage]);

	return (
		<div className="flex flex-col md:flex-row w-full h-[75vh] gap-6 max-w-[950px] mx-auto relative bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl">
			{/* Left Column */}
			<div className="md:w-1/3 w-full flex flex-col gap-6 p-4 border-r border-slate-800/80 h-full overflow-y-auto">
				<div className="text-xl font-bold text-white mb-2 flex items-center gap-2">
					<Brain className="w-5 h-5 text-indigo-400" />
					<span>AI Providers</span>
				</div>

				{/* Tab Selector */}
				<div className="flex md:flex-col gap-2">
					{[...tabNames, 'Cloud/Other'].map(tab => (
						<button
							key={tab}
							className={`py-2.5 px-4 rounded-xl text-left font-medium text-sm transition-all duration-200 ${currentTab === tab
								? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
								: 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
								}`}
							onClick={() => {
								setCurrentTab(tab as TabName);
								setErrorMessage(null);
							}}
						>
							{tab}
						</button>
					))}
				</div>

				{/* Feature Checklist */}
				<div className="flex flex-col gap-2 mt-auto pt-4 border-t border-slate-800/80 text-xs font-mono text-slate-400">
					<span className="text-slate-200 font-semibold mb-1">Feature Status</span>
					{featureNameMap.map(({ display, featureName }) => {
						const hasModel = settingsState.modelSelectionOfFeature[featureName] !== null;
						return (
							<div key={featureName} className="flex items-center gap-2">
								{hasModel ? (
									<Check className="w-4 h-4 text-emerald-400" />
								) : (
									<div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
								)}
								<span>{display}</span>
							</div>
						);
					})}
				</div>
			</div>

			{/* Right Column */}
			<div className="flex-1 flex flex-col items-center justify-start p-4 h-full overflow-y-auto text-left">
				<div className="text-2xl font-bold mb-1 text-white w-full">Configure {currentTab} Models</div>
				<div className="text-xs text-slate-400 mb-6 w-full">{descriptionOfTab[currentTab]}</div>

				{providerNamesOfTab[currentTab].map((providerName) => (
					<div key={providerName} className="w-full max-w-xl mb-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
						<div className="text-sm font-semibold mb-2 text-indigo-300">
							{displayInfoOfProviderName(providerName).title}
						</div>
						<div>
							<SettingsForProvider providerName={providerName} showProviderTitle={false} showProviderSuggestions={true} />
						</div>
						{providerName === 'ollama' && <OllamaSetupInstructions />}
					</div>
				))}

				{(currentTab === 'Local' || currentTab === 'Cloud/Other') && (
					<div className="w-full max-w-xl mt-4 bg-slate-950/60 rounded-xl p-4 border border-slate-800">
						<div className="text-sm font-semibold mb-2 text-indigo-300">Custom Models</div>
						{currentTab === 'Local' && <ModelDump filteredProviders={localProviderNames} />}
						{currentTab === 'Cloud/Other' && <ModelDump filteredProviders={cloudProviders} />}
					</div>
				)}

				{/* Bottom Actions */}
				<div className="flex flex-col items-center w-full mt-auto pt-6 border-t border-slate-800/80 gap-3">
					{errorMessage && (
						<div className="text-amber-400 text-xs font-mono">{errorMessage}</div>
					)}
					
					<div className="flex items-center justify-between w-full">
						<button
							onClick={() => setPageIndex(pageIndex - 1)}
							className="px-5 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition-colors"
						>
							Back
						</button>

						<button
							onClick={() => {
								setPageIndex(pageIndex + 1);
								setErrorMessage(null);
							}}
							className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
						>
							<span>Continue</span>
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>

					<button
						onClick={() => voidSettingsService.setGlobalSetting('isOnboardingComplete', true)}
						className="text-xs text-slate-400 hover:text-white underline underline-offset-4 opacity-70 hover:opacity-100 transition-all mt-1"
					>
						Skip API Key Setup & Enter IDE
					</button>
				</div>
			</div>
		</div>
	);
};

const OnboardingPageShell = ({ content, bottom }: { content?: React.ReactNode, bottom?: React.ReactNode }) => {
	return (
		<div className="h-[80vh] text-base flex flex-col justify-between items-center w-full max-w-[650px] mx-auto p-4">
			{content && <FadeIn className="w-full my-auto">{content}</FadeIn>}
			{bottom && <div className="w-full pt-4">{bottom}</div>}
		</div>
	);
};

const VoidOnboardingContent = () => {

	const accessor = useAccessor()
	const voidSettingsService = accessor.get('IVoidSettingsService')
	const voidMetricsService = accessor.get('IMetricsService')
	const voidSettingsState = useSettingsState()

	const [pageIndex, setPageIndex] = useState(0)

	useEffect(() => {
		if (!voidSettingsState.globalSettings.isOnboardingComplete) {
			setPageIndex(0)
		}
	}, [setPageIndex, voidSettingsState.globalSettings.isOnboardingComplete])

	const contentOfIdx: { [pageIndex: number]: React.ReactNode } = {
		0: <OnboardingPageShell
			content={
				<div className="flex flex-col items-center gap-6 text-center bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl">
					<IncogniAILogo />

					<h1 className="text-3xl font-extrabold text-white tracking-tight">
						Welcome to IncogniAI IDE
					</h1>
					
					<p className="text-sm text-slate-400 max-w-md leading-relaxed">
						The ultimate privacy-first AI Code Editor. Powerful inline AI, local model routing, and complete data ownership.
					</p>

					{/* Highlights */}
					<div className="grid grid-cols-1 gap-3 w-full max-w-md text-left text-xs text-slate-300 mt-2 font-mono">
						<div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-3">
							<Shield className="w-5 h-5 text-emerald-400 flex-shrink-0" />
							<span><strong>100% Privacy First</strong> — Zero telemetry or remote code logging.</span>
						</div>
						<div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-3">
							<Zap className="w-5 h-5 text-indigo-400 flex-shrink-0" />
							<span><strong>Local & Cloud Models</strong> — Use Ollama, Claude, DeepSeek, or OpenAI.</span>
						</div>
						<div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-3">
							<Lock className="w-5 h-5 text-purple-400 flex-shrink-0" />
							<span><strong>VS Code Native</strong> — Built on VS Code core with full extension support.</span>
						</div>
					</div>

					{/* Main Continue Button */}
					<div className="w-full max-w-md mt-4 flex flex-col items-center gap-4">
						<button
							onClick={() => setPageIndex(1)}
							className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 transition-all flex items-center justify-center gap-2 border border-indigo-400/30"
						>
							<span>Continue to Setup</span>
							<ChevronRight className="w-4 h-4" />
						</button>

						<button
							onClick={() => voidSettingsService.setGlobalSetting('isOnboardingComplete', true)}
							className="text-xs text-slate-400 hover:text-white underline underline-offset-4 opacity-70 hover:opacity-100 transition-all"
						>
							Skip Onboarding & Enter IDE
						</button>
					</div>
				</div>
			}
		/>,

		1: <OnboardingPageShell
			content={
				<AddProvidersPage pageIndex={pageIndex} setPageIndex={setPageIndex} />
			}
		/>,

		2: <OnboardingPageShell
			content={
				<div className="flex flex-col items-center gap-6 text-center bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl w-full">
					<IncogniAILogo />

					<h2 className="text-2xl font-bold text-white tracking-tight">
						Import Settings & Finalize
					</h2>

					<p className="text-xs text-slate-400 max-w-md">
						Transfer your existing editor extensions, keybindings, and settings into IncogniAI IDE with a single click.
					</p>

					<div className="mt-4 flex flex-col gap-3 w-full max-w-sm">
						<OneClickSwitchButton className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs" fromEditor="VS Code" />
						<OneClickSwitchButton className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs" fromEditor="Cursor" />
						<OneClickSwitchButton className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs" fromEditor="Windsurf" />
					</div>

					<div className="w-full max-w-sm mt-6 flex flex-col items-center gap-3">
						<button
							onClick={() => {
								voidSettingsService.setGlobalSetting('isOnboardingComplete', true);
								voidMetricsService.capture('Completed Onboarding', {});
							}}
							className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:brightness-110 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 border border-indigo-400/30"
						>
							<span>Enter IncogniAI IDE</span>
							<ChevronRight className="w-4 h-4" />
						</button>

						<button
							onClick={() => voidSettingsService.setGlobalSetting('isOnboardingComplete', true)}
							className="text-xs text-slate-400 hover:text-white underline underline-offset-4 opacity-70 hover:opacity-100 transition-all"
						>
							Skip & Launch IDE
						</button>
					</div>
				</div>
			}
		/>,
	}

	return (
		<div key={pageIndex} className="w-full h-[85vh] text-left mx-auto flex flex-col items-center justify-center">
			<ErrorBoundary>
				{contentOfIdx[pageIndex]}
			</ErrorBoundary>
		</div>
	)
}
