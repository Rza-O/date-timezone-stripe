import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useUser = () => {
	const {
		data: user,
		error,
		isLoading,
	} = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			const { data } = await axios.get("/api/user");
			return data.user;
		},
	});
	return { user, error, isLoading };
};
