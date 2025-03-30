import { db } from '@/server/db';
import { auth, clerkClient } from '@clerk/nextjs/server';import { redirect } from 'next/navigation';
;

type Props = {
    params: Promise<{projectId: string}>
}

const JoinHandler = async (props: Props) => {
    const {projectId} = await props.params;
    console.log('projectId', projectId);
    const {userId} = await auth();
    console.log('userId', userId);
    
    if(!userId) return redirect('/signIn');
    const dbUser = await db.user.findUnique({
        where: {
            id: userId
        }
    })
    console.log('dbUser', dbUser);
    

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    console.log('user', user);
    if(!dbUser) {
        await db.user.create({
            data: {
                id: userId,
                emailAddress: user.emailAddresses[0]!.emailAddress,
                imageUrl: user.imageUrl,
                firstName: user.firstName,
                lastName: user.lastName,
            }
        })
    }
    const project = await db.project.findUnique({
        where: {
            id: projectId
        }
    })
    console.log('project', project);
    if(!project) return redirect('/dashboard');
    try{
        await db.userProject.create({
            data: {
                userId,
                projectId
            }
        });
    }catch(e) {
        console.error(e);
    }
    return redirect('/dashboard');
}

export default JoinHandler