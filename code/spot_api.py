import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from flask import url_for


def create_spotify_oauth():
    return SpotifyOAuth(
        client_id=os.environ.get("CLIENT_ID"),
        client_secret=os.environ.get("CLIENT_SECRET"),
        redirect_uri=url_for("/spotify_utils/redirect_page", _external=True),
        scope="user-library-read user-library-modify playlist-modify-public"
    )