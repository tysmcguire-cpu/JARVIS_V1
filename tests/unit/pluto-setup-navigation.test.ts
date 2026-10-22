import {it,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {settingsSections,settingsSection,settingsHref,suggestedPlan} from '@/features/settings/navigation';
import {SetupGuide} from '@/features/auth/setup-guide';
it('maps every Settings section and preserves the existing subscription alias',()=>{
 for(const section of settingsSections){expect(settingsSection('#'+section.hash)).toBe(section.id);expect(settingsSection('#'+section.id)).toBe(section.id);expect(settingsHref(section.id)).toBe('/settings#'+section.hash)}
 expect(settingsSection('#unknown')).toBe('preferences');expect(settingsHref('billing',true,'pro')).toBe('/demo/settings?plan=pro#subscription');
});
it('accepts only supported plan hints without treating them as entitlements',()=>{
 for(const plan of ['free','plus','pro'])expect(suggestedPlan(plan)).toBe(plan);
 for(const input of ['ultimate','https://outside.invalid','pro#data',null,[],{}])expect(suggestedPlan(input)).toBeUndefined();
});
it('shows unavailable optional services honestly and carries plan review to Settings',()=>{
 const html=renderToStaticMarkup(createElement(SetupGuide,{plan:'plus',availability:{checkout:false,integrations:false,telegram:false,ai:false}}));
 expect(html).toContain('/settings?plan=plus#subscription');expect(html).toContain('New paid subscriptions are not open yet');expect(html).toContain('The Pluto bot is not available yet');expect(html).toContain('Paid AI is not active');expect(html).toContain('does not start a subscription or charge you');
});
