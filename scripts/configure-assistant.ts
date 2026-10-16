import {PrismaClient} from '@prisma/client';
process.loadEnvFile('.env');const admin=new PrismaClient({datasources:{db:{url:process.env.DIRECT_URL}}});
async function configure(){const owner=await admin.user.findUnique({where:{id:process.env.JARVIS_OWNER_ID}});if(!owner||owner.synthetic)throw Error('Owner mismatch');for(const table of ['AiConversation','AiSourceReference'])await admin.$executeRawUnsafe(`GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public."${table}" TO jarvis_app`);console.info('Assistant runtime permissions configured. No AI request made.');}
configure().catch(()=>{console.error('Assistant permission setup failed; private details suppressed.');process.exitCode=1}).finally(()=>admin.$disconnect());
