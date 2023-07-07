import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from flask import url_for


def create_spotify_oauth():
    return SpotifyOAuth(
        client_id=os.environ.get("CLIENT_ID"),
        client_secret=os.environ.get("CLIENT_SECRET"),
        redirect_uri=url_for("redirect_page", _external=True),
        scope="user-library-read user-library-modify playlist-modify-public"
    )


def refresh_token(token_info):
    sp_oauth = create_spotify_oauth()
    return sp_oauth.refresh_access_token(token_info["refresh_token"])


def get_curr_user(token_info):
    sp = spotipy.Spotify(auth=token_info["access_token"])
    return sp.current_user()