type Props = {
    params: Promise<{ meetingId: string }>;
};

const MeetingDetailsPage = async ({params}: Props) => {
    const {meetingId} = await params;
    return (
        <div className="">{meetingId}</div>
    );
};

export default MeetingDetailsPage;