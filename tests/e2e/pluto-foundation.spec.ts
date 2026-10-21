import {test,expect} from '@playwright/test';
test('Pluto branding, closed registration and fail-closed private routes',async({page})=>{
 await page.goto('/demo');await expect(page.getByRole('heading',{name:'PLUTO',exact:true})).toBeVisible();expect(await page.locator('body').innerText()).not.toMatch(/jarvis|j\.a\.r\.v\.i\.s/i);
 await page.goto('/login');await expect(page.getByRole('heading',{name:'Welcome back',exact:true})).toBeVisible();await expect(page.getByText('Commercial authentication is not configured. Access is locked.')).toBeVisible();
 await page.goto('/register');await expect(page.getByText('Registration is closed during development.')).toBeVisible();await expect(page.getByRole('button',{name:'Register',exact:true})).toHaveCount(0);
 await page.goto('/');await expect(page).toHaveURL(/\/login\?status=configuration/);await page.goto('/onboarding');await expect(page).toHaveURL(/\/login\?status=configuration/);
 await page.goto('/auth/callback?code=synthetic-only');await expect(page).toHaveURL(/\/login\?status=configuration/);
});
test('recovery response stays generic without an external connection',async({page})=>{await page.goto('/forgot-password');await page.getByLabel('Email',{exact:true}).fill('synthetic@example.invalid');await page.getByRole('button',{name:'Send reset link',exact:true}).click();await expect(page.getByText('If the account is eligible, a reset email will arrive shortly.')).toBeVisible()});
