"use client"
import { useUser } from "@clerk/nextjs";

const Dashboard =  () => {
    const {user} = useUser();
  return (
    <div className="">
      <div>{user?.firstName}</div>
      <div>{user?.lastName}</div>
    </div>
  )
}

export default Dashboard;
