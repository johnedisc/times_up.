import { _timesUpApp } from "../main.js";
import { UserDataAPI } from "./UserDataAPI.js"

export const LoadData = async (userCredentials) => {
  _timesUpApp.store.user = await UserDataAPI.fetchUser();

}
