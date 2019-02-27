# /local

This document covers the local music collection searching mechanisms.

## GET /local/search?query="queryString"

Returns a list of songs which match the query string.

Capability: localSearch

#### Response
```
{
  "songs": [
    {
      "uri": "local://something/something.mp3",
      "id3": {
        "title": "Something",
        "artist": "Joe",
        "album": "ThatOneAlbum",
        "year": "1900",
        "comment": "This is a comment",
        "track": 1,
        "genre": 0
      }
    }
  ]
}
```

NOTE: None of the fields in id3 are required to be filled, however most of them
will.

Genre is an index into the genre table, listed here: https://en.wikipedia.org/wiki/List_of_ID3v1_Genres
