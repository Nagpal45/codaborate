'use client';

import useproject from '@/hooks/useProject';
import { api } from '@/trpc/react';
import React from 'react'

const TeamMembers = () => {
    const {projectId} = useproject();
    const {data: teamMembers} = api.project.getTeamMembers.useQuery({projectId});

  return (
    <div className='flex items-center gap-2'>
        {teamMembers?.map((member) => (
            <img key={member.id} src={member.user.imageUrl || ''} alt={member.user.firstName || ''}  className='rounded-full' height={30} width={30} />
        ))}
    </div>
  )
}

export default TeamMembers