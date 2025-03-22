import { useQueryClient } from "@tanstack/react-query"


function useRefetch() {
    const queryClient = useQueryClient();
    return async () => {
        await queryClient.refetchQueries({
                type: 'active'
        });
    }
}

export default useRefetch;