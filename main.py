import logging
from flask import Flask, render_template, url_for, redirect, request
import twitter
import json

root_dir = '/neighborhood'

app = Flask(
    __name__,
    static_url_path=root_dir,
    static_folder='static',
    template_folder='templates'
)


#
# Neighborhood
@app.route(root_dir)
@app.route(root_dir + '/')
def mainPage():
    return render_template('index.html')


#
# Get tweets
@app.route(root_dir + '/tweets/')
def tweets():
    api = twitter.Api(consumer_key='jg3FvJyqhAAsHZmXoXmKy2dL6',
                      consumer_secret='piqhk6MlrjQiZoIbU0x6B94YjR94klOCxn5QK5Rt4Yn9YZq5Y4',
                      access_token_key='477366124-WkDC25Afdydggr4vNvZgFdPTnO9BimIxmPxOU6j0',
                      access_token_secret='jhjZi0YwJHgtydOqlhM8y0cF9DLY5NSC3Enc7oPop6heR',
                      cache=None,
                      sleep_on_rate_limit=True)


    location = request.args.get('location', '')
    pos = request.args.get('geocode', '')
    count = request.args.get('count', 16)

    if not (location and pos):
        return "ERROR"

    term = '%23' + location
    geocode = pos + ',50mi'
    results = api.GetSearch(term=term, geocode=geocode, count=count)

    json_response = {"tweet": []}
    for status in results:

        # print status.AsJsonString()

        json_dict = {}

        json_dict['user'] = {'screen_name': status.user.screen_name, 'name': status.user.name, "profile_image_url": status.user.profile_image_url}
        json_dict['tweet_text'] = status.text,
        json_dict['status_id'] = status.id_str,
        json_dict['tweet_created'] = status.created_at
        json_dict['tweet_created_in_seconds'] = status.created_at_in_seconds

        json_response.get('tweet').append(json_dict)

    return json.dumps(json_response)


@app.errorhandler(500)
def server_error(e):
    # Log the error and stacktrace.
    logging.exception('An error occurred during a request.')
    return 'An internal error occurred.', 500

if __name__ == '__main__':
    app.debug = False
    app.run()
