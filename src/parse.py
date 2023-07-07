import json

def main():
    files = 4
    song_counts = {}

    for i in range(files):
        f = open('../data/streaming_history/endsong_' + str(i) + '.json')
        data = json.load(f)

        for item in data:
            song = '' if item['master_metadata_track_name'] is None else item['master_metadata_track_name']
            artist = '' if item['master_metadata_album_artist_name'] is None else item['master_metadata_album_artist_name']
            song_str = song + ' - ' + artist
            if song_str == ' - ' or item['ms_played'] < 30000:
                continue
            if not song_str in song_counts:
                song_counts[song_str] = 1
            else:
                song_counts[song_str] += 1

    out = open('../output/song_counts.txt', 'w+')

    sorted_counts = sorted(song_counts.items(), key=lambda x: x[1], reverse=True)
    for item in sorted_counts:
        out.write(item[0] + ': ' + str(item[1]) + '\n')

    out.close()

if __name__ == '__main__':
    main()