"use client";
import { SpotifyOauthButton } from "../oauth/buttons";

export default function Form() {
  const initialState = {
    status: 0,
    message: "",
  };

  return (
    <>     
      <SpotifyOauthButton />
    </>
  );
}
