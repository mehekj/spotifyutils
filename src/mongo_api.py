import os
import datetime

from flask_pymongo import MongoClient

mongo = MongoClient(os.environ.get("MONGO_URI")).get_database('spotutils')


def get_user_data(uri):
    return mongo.users.find_one({'uri': uri})


def reset_user_data(uri):
    if get_user_data(uri):
        mongo.users.update_one(
            {'uri': uri}, {'$set': {'last_upload': str(datetime.datetime.now())}})
    else:
        mongo.users.insert_one(
            {'uri': uri, 'last_upload': str(datetime.datetime.now())})

    mongo.streams.delete_many({"user_uri": uri})


def insert_stream_data(data, user_uri):
    result = []
    for item in data:
        if item['spotify_track_uri'] is None:
            continue
        item['user_uri'] = user_uri
        del item['username']
        del item['ip_addr_decrypted']
        del item['user_agent_decrypted']
        del item['episode_name']
        del item['episode_show_name']
        del item['spotify_episode_uri']
        del item['offline_timestamp']
        result.append(item)
    mongo.streams.insert_many(result)


def get_most_streamed(user_uri):
    return list(mongo.streams.aggregate([
        {
            '$match': {
                '$and': [
                    {
                        'user_uri': user_uri
                    }, {
                        '$expr': {
                            '$gte': [
                                '$ms_played', 30000
                            ]
                        }
                    }
                ]
            }
        }, {
            '$group': {
                '_id': '$spotify_track_uri',
                'track': {
                    '$first': '$master_metadata_track_name'
                },
                'artist': {
                    '$first': '$master_metadata_album_artist_name'
                },
                'count': {
                    '$sum': 1
                }
            }
        }, {
            '$group': {
                '_id': {
                    'track': '$track',
                    'artist': '$artist'
                },
                'count': {
                    '$sum': '$count'
                },
                'uri': {
                    '$max': '$_id'
                },
                'track': {
                    '$first': '$track'
                },
                'artist': {
                    '$first': '$artist'
                }
            }
        }, {
            '$sort': {
                'count': -1
            }
        }
    ]))
