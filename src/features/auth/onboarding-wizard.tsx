'use client';
import {submitOnboarding} from './onboarding-actions';
import {OnboardingForm} from './onboarding-form';
export function OnboardingWizard({checkout}:{checkout:boolean}){
 return <OnboardingForm checkout={checkout} submit={submitOnboarding}/>;
}
