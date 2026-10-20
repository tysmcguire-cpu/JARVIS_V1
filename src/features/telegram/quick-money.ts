import {parseMoney} from '@/features/tracking/config';
import {CommandError} from './commands';
export function quickMoney(text:string){
 const match=/^([+-])(\d{1,12}(?:\.\d{1,2})?)(?:\s+([^|]+?))?(?:\s*\|\s*([^|]+))?$/.exec(text.trim());
 if(!match)throw new CommandError('Use +400 or -20 food. For a specific account: -20 food | Checking. Use at most two decimal places.');
 const amount=match[2];if(parseMoney(amount)<=0n)throw new CommandError('Enter an amount greater than zero.');
 const kind=match[1]==='+'?'income':'expense',words=(match[3]??'').trim(),[first,...rest]=words.split(/\s+/),category=first|| (kind==='income'?'Income':'Uncategorized'),description=rest.join(' ')||category,account=match[4]?.trim();
 if(category.length>100||description.length>200||(account&&account.length>200))throw new CommandError('Keep the category under 100 characters and description/account under 200.');
 return {kind,amount,category:category.charAt(0).toUpperCase()+category.slice(1),description,account};
}
