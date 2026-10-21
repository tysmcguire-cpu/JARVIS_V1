export const dynamic='force-dynamic';
import {OnboardingWizard} from '@/features/auth/onboarding-wizard';
import {features} from '@/features/commercial/flags';
import {requireCustomer} from '@/features/auth/server';
export default async function Onboarding(){await requireCustomer();return <main className="login-screen"><OnboardingWizard checkout={features.checkout()}/></main>}
