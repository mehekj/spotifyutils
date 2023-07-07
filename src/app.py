import os
import time

from bson import json_util
from flask import (Flask, current_app, g, json, redirect, render_template,
                   request, session, url_for)
from flask_wtf import FlaskForm
from wtforms import MultipleFileField, SubmitField

from src.spot_api import create_spotify_oauth, get_curr_user, refresh_token
from src.mongo_api import get_user_data, reset_user_data, insert_stream_data, get_most_streamed

app = Flask(__name__)

app.secret_key = os.environ.get("SECRET_KEY")


class UploadFileForm(FlaskForm):
    files = MultipleFileField("JSON files")
    submit = SubmitField("Upload File")


def get_token():
    token_info = session.get("token_info", None)
    if not token_info:
        raise "exception"

    now = int(time.time())
    is_expired = token_info["expires_at"] - now < 60
    if (is_expired):
        token_info = refresh_token(token_info)

    return token_info


@app.route("/")
def index():
    return render_template("index.html")


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
    session["user_uri"] = get_curr_user(token_info)['uri'].split(':')[-1]
    return redirect(url_for("home", _external=True))


@app.route("/upload", methods=["GET", "POST"])
def upload():
    try:
        get_token()
    except:
        return redirect(url_for("login", _external=True))

    form = UploadFileForm()
    if form.validate_on_submit():
        user_uri = session["user_uri"]
        reset_user_data(user_uri)

        for file in form.files.data:
            data = json.load(file)
            insert_stream_data(data, user_uri)

        return redirect(url_for("home", _external=True))

    return render_template("upload.html", form=form)


@app.route("/home")
def home():
    try:
        token_info = get_token()
    except:
        return redirect(url_for("login", _external=True))

    curr_user = get_curr_user(token_info)
    user_data = get_user_data(session["user_uri"])
    # streams = get_most_streamed(session["user_uri"])
    # print(streams)
    return render_template("home.html", username=curr_user['display_name'], user=user_data)

# ts
# platform
# ms_played
# conn_country
# master_metadata_track_name
# master_metadata_album_artist_name
# master_metadata_album_album_name
# reason_start
# reason_end
# shuffle
# skipped
# offline
# incognito_mode
# spotify_track_uri
