const express = require('express');
const util = require('util');
const googleMaps = require('@google/maps');

const History = require('../schemas/history');
const Favorite = require('../schemas/favorite');

const router = express.Router();

const googleMapsClient = googleMaps.createClient({
  key: process.env.PLACES_API_KEY,
});

router.get('/', async (req, res, next) => {
  try {
    const favorites = await Favorite.find({});
    res.render('index', {
      results: favorites,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get('/autoComplete/:query', (req, res, next) => {
  googleMapsClient.placesQueryAutoComplete(
    {
      input: req.params.query,
      language: 'ko',
    },
    (err, response) => {
      if (err) return next(err);
      return res.json(response.json.predictions);
    },
  );
});

router.get('/search/:query', async (req, res, next) => {
  // 바꿀수 있는 콜백들은 promisify 를 사용하여 프로미스로 바꿔서 await/async 문법을 사용하는게 깔끔하다.
  const googlePlaces = util.promisify(googleMapsClient.places);
  const googlePlacesNearby = util.promisify(googleMapsClient.placesNearby);
  const { lat, lng, type } = req.query;
  try {
    const history = new History({ query: req.params.query });
    await history.save();
    let response;
    if (lat && lng) {
      // 쿼리스트링으로 lat, lng이 제공되면 places API 대신에 placesNearby API를 사용
      response = await googlePlacesNearby({
        keyword: req.params.query, // 찾을 검색어
        location: `${lat},${lng}`, // 위도와 경도
        rankby: 'distance', // 정렬 순서, rankby 대신에 radius(반경, 미터 단위)를 입력하면 인기순으로 검색한다. ex) radius: 5000,
        language: 'ko', // 검색 언어
        type, // type을 주면 장소의 종류까지 선택 가능 ex) 상점, 카페 등
      });
    } else {
      response = await googlePlaces({
        query: req.params.query,
        language: 'ko',
        type,
      });
    }
    res.render('result', {
      title: `${req.params.query} 검색 결과`,
      results: response.json.results,
      query: req.params.query,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.post('/location/:id/favorite', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, lat, lng } = req.body;
    const favorite = new Favorite({
      placeId: id,
      name: name,
      location: [lng, lat], // 장소를 넣을 때 경도, 위도 순으로 넣어야함. Google Maps API를 사용할 때와 반대임
    });
    const response = await favorite.save();
    res.send(favorite);
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;
