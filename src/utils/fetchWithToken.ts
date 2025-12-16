import AsyncStorage from "@react-native-async-storage/async-storage";

export async function fetchWithToken(url: string, options: any = {}) {
  try {
    // get token from storage
    const token = await AsyncStorage.getItem("accessToken");

    // add headers
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : "",
    };

    // start request
    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  } catch (error) {
    console.log("Fetch error:", error);
    throw error;
  }
}