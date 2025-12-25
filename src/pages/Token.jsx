import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import SEO from "../components/SEO";

import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

import { Spinner } from "@nextui-org/spinner";
import { v4 as uuidv4 } from "uuid";
import Lottie from "lottie-react";

import happy from "../assets/lotte/happy.json";
import sad from "../assets/lotte/sad.json";

export default function Token() {
  const [loading, setLoading] = useState(true);
  const [tokenCreationStatus, setTokenCreationStatus] = useState(null);
  const [countdown, setCountdown] = useState(10);

  const SHORTNER_TIME = import.meta.env.VITE_SHORTNER_TIME;
  const SITENAME = import.meta.env.VITE_SITENAME;

  const { tokenID } = useParams();
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  // Fetch the user's token from Firestore
  const fetchUserToken = async (userId) => {
    try {
      const userTokenDoc = await getDoc(doc(db, "tokens", userId));
      if (userTokenDoc.exists()) {
        return userTokenDoc.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      return null;
    }
  };

  // Create and store the token with an expiration timestamp
  const createAndStoreToken = async () => {
    const userTokenData = await fetchUserToken(userId);

    if (userTokenData && userTokenData.token === tokenID) {
      // If token matches, refresh with new one
      const expiresAt = Date.now() + SHORTNER_TIME * 60 * 60 * 1000;
      try {
        const newToken = uuidv4();
        await setDoc(doc(db, "tokens", userId), { token: newToken, expiresAt });
        setTokenCreationStatus(true);
      } catch (error) {
        console.error("Error storing token:", error);
        setTokenCreationStatus(false);
      }
    } else {
      // Token mismatch or not found
      setTokenCreationStatus(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (userId && tokenID) {
      createAndStoreToken();
    }
  }, [userId, tokenID]);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          clearInterval(countdownInterval);
          // Instead of window.close(), redirect
          window.location.href = "/";
          return 0;
        }
        return prevCountdown - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

  return (
    <div className="text-primaryTextColor flex items-center justify-center">
      <SEO
        title={SITENAME}
        description={`Discover a world of entertainment where every show, movie, and exclusive content takes you on a journey beyond the screen. ${SITENAME} offers endless options for every mood, helping you relax, escape, and imagine more.`}
        name={SITENAME}
        type="text/html"
        link={`https://${SITENAME}.com`}
      />

      {loading && (
        <Spinner
          label="Verifying Token..."
          labelColor="warning"
          color="warning"
          className="h-screen"
        />
      )}

      {!loading && tokenCreationStatus === true && (
        <div className="flex flex-col justify-center gap-5 items-center mt-20">
          <Lottie animationData={happy} className="size-6/12" loop autoplay />
          <h1>Done! Token refreshed for {SHORTNER_TIME} hr.</h1>
          <h2>Redirecting in: {countdown} seconds</h2>
        </div>
      )}

      {!loading && tokenCreationStatus === false && (
        <div className="flex flex-col justify-center gap-5 items-center mt-20">
          <Lottie animationData={sad} className="size-6/12" loop autoplay />
          <h1>Sorry, token verification failed.</h1>
          <h2>Redirecting in: {countdown} seconds</h2>
        </div>
      )}
    </div>
  );
}
