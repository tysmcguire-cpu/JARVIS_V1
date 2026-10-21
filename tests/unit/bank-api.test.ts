import {it,expect,vi,afterEach} from 'vitest';
vi.mock('server-only',()=>({}));
import {bankConfig,bankAvailability} from '@/features/banking/config';
import {bankRequest,exactBankMoney,normalizeTransaction,normalizeAccount} from '@/features/banking/api';
const setup=()=>{for(const [key,value] of Object.entries({PLAID_ENABLED:'true',PLAID_ENV:'sandbox',PLAID_CLIENT_ID:'synthetic-client',PLAID_SECRET:'synthetic-secret',PLAID_REDIRECT_URI:'http://localhost:3000/bank-link',PLUTO_CONNECTOR_ENCRYPTION_KEY:'a'.repeat(64)}))vi.stubEnv(key,value)};
afterEach(()=>vi.unstubAllEnvs());
it('defaults disabled, gates production on owner-confirmed Trial and validates redirect destinations',()=>{
 vi.stubEnv('PLAID_ENABLED','false');expect(bankAvailability().ready).toBe(false);setup();expect(bankConfig().base).toBe('https://sandbox.plaid.com');vi.stubEnv('PLAID_ENV','production');expect(()=>bankConfig()).toThrow('Trial');vi.stubEnv('PLAID_TRIAL_CONFIRMED','true');expect(()=>bankConfig()).toThrow('redirect');vi.stubEnv('PLAID_REDIRECT_URI','https://synthetic.onrender.com/bank-link');expect(bankConfig().base).toBe('https://production.plaid.com');for(const uri of ['https://user:password@example.invalid/bank-link','https://example.invalid/bank-link?x=1','https://example.invalid/other']){vi.stubEnv('PLAID_REDIRECT_URI',uri);expect(()=>bankConfig()).toThrow()}
});
it('uses exact minor units with Plaid outflow signs and preserves unknown account balances',()=>{
 expect(exactBankMoney(0.1)).toBe(10n);expect(exactBankMoney(-1234.56)).toBe(-123456n);expect(()=>exactBankMoney(0.001)).toThrow();expect(()=>exactBankMoney(Infinity)).toThrow();
 expect(normalizeTransaction({transaction_id:'synthetic-tx',account_id:'a',date:'2026-10-17',name:'Synthetic refund',amount:-12.34,iso_currency_code:'USD',pending:false}).payload).toMatchObject({amount:'1234',direction:'inflow',status:'posted'});
 expect(normalizeAccount({account_id:'a',name:'Synthetic checking',mask:null,type:'depository',subtype:'checking',balances:{current:null,available:null,iso_currency_code:'USD'}}).payload.current).toBe('');
});
it('calls only approved data endpoints on pinned Plaid domains with redacted errors and bounded responses',async()=>{
 setup();const fetcher=vi.fn<typeof fetch>(async()=>new Response('{}'));await bankRequest('/accounts/get',{access_token:'synthetic-access'},fetcher);expect(fetcher.mock.calls[0][0]).toBe('https://sandbox.plaid.com/accounts/get');expect(fetcher.mock.calls[0][1]).toMatchObject({method:'POST',redirect:'error',cache:'no-store'});
 await expect(bankRequest('/transactions/refresh' as '/accounts/get',{},fetcher)).rejects.toThrow();expect(fetcher).toHaveBeenCalledTimes(1);
 for(const response of [new Response('x'.repeat(2097153)),new Response('not-json'),new Response(JSON.stringify({error_code:'UNSAFE_PRIVATE_ERROR',error_message:'private-secret'}),{status:400})])await expect(bankRequest('/accounts/get',{},vi.fn(async()=>response))).rejects.not.toThrow('private-secret');
});
