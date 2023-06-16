import os
import time

import spotipy
from flask import Flask, redirect, request, session, url_for
from src.spot_api import create_spotify_oauth

# https://www.youtube.com/watch?v=1TYyX8soQ8M


app = Flask(__name__)

app.secret_key = os.environ.get("SECRET_KEY")


def get_token():
    token_info = session.get("token_info", None)
    if not token_info:
        raise "exception"
    
    now = int(time.time())
    is_expired = token_info["expires_at"] - now < 60
    if (is_expired):
        sp_oauth = create_spotify_oauth()
        token_info = sp_oauth.refresh_access_token(token_info["refresh_token"])

    return token_info


@app.route("/")
def index():
    try:
        get_token()
    except:
        return redirect(url_for("login"))
    return redirect(url_for("get_tracks", _external=True))


@app.route("/login")
def login():
    sp_oauth = create_spotify_oauth()
    auth_url = sp_oauth.get_authorize_url()
    return redirect(auth_url)


@app.route("/redirect")
def redirect_page():
    sp_oauth = create_spotify_oauth()
    session.clear()
    code = request.args.get('code')
    token_info = sp_oauth.get_access_token(code)
    session["token_info"] = token_info
    return redirect(url_for("get_tracks", _external=True))


@app.route("/get_tracks")
def get_tracks():
    try:
        token_info = get_token()
    except:
        return redirect(url_for("login"))
    
    sp = spotipy.Spotify(auth=token_info["access_token"])
    return list(map(lambda item: item['track']['name'] + ' - ' + item['track']['artists'][0]['name'], sp.current_user_saved_tracks(limit=50, offset=0)['items']))