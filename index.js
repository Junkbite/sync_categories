const rp = require("request-promise");

const settings = {
  url: "http://localhost:8080",
  username: "admin",
  password: "adminadmin",

  categories: {
    aither: ["aither"],
    alpharatio: ["alpharatio"],
    anthelion: ["anthelion"],
    beyondhd: ["beyond-hd"],
    bithdtv: ["bit-hdtv"],
    blutopia: ["blutopia"],
    channelx: ["channelx"],
    cinemageddon: ["cinemageddon"],
    digitalcore: ["digitalcore"],
    dxdhd: ["dxdhd"],
    ggn: ["gazellegames"],
    hdspace: ["hd-space"],
    hdtorrents: ["hd-torrents", "hdts-announce"],
    hdme: ["hdme"],
    horrorcharnel: ["horrorcharnel"],
    iptorrents: [
      "localhost.stackoverflow.tech",
      "routing.bgp.technology",
      "ssl.empirehost.me",
    ],
    legacyhd: ["legacyhd"],
    milkie: ["milkie"],
    myanonamouse: ["myanonamouse"],
    nebulance: ["nebulance"],
    orpheus: ["opsfet"],
    privatehd: ["privatehd"],
    ptfiles: ["ptfiles"],
    redacted: ["flacsfor.me"],
    revolutiontt: ["revolutiontt"],
    scenetime: ["scenetime"],
    torrentday: ["td-peers", "jumbohostpro"],
    torrentleech: ["tleechreload"],
    tvvault: ["tv-vault"],
    uhdbits: ["uhdbits"],
  },
};

const API_PATH = "api/v2";

const delay = async (timeout = 1) =>
  new Promise((resolve) => setTimeout(resolve, timeout));

let _jar = null;
async function getCookieJar() {
  if (_jar) return _jar;

  // if not jar then we need to create one and login to have session cookies
  _jar = rp.jar();

  await postData({
    url: `${settings.url}/${API_PATH}/auth/login`,
    jar: _jar,
    form: {
      username: settings.username,
      password: settings.password,
    },
  });

  return _jar;
}

const logger = async (message) => console.log(message);

const getUncategorizedTorrentHashes = async () => {
  const uri = `${settings.url}/${API_PATH}/sync/maindata`;

  const response = await getData({
    uri,
    jar: await getCookieJar(),
  });

  const torrents = Object.entries(response.torrents).reduce(
    (acc, [hash, torrent]) => {
      acc.push({ ...torrent, hash });
      return acc;
    },
    []
  );

  return torrents.filter((torrent) => !torrent.category);
};

async function setCategory(torrent) {
  const torrentTrackers = await getTorrentTrackers(torrent.hash);

  for await (const category of Object.keys(settings.categories)) {
    const site = settings.categories[category];

    for await (const siteTracker of site) {
      if (!siteTracker) continue;

      for await (const torrentTracker of torrentTrackers) {
        if (torrentTracker.url.includes(siteTracker)) {
          await logger(
            `set ${torrent.name} to ${category} (${torrentTracker.url})`
          );
          return await setTorrentCategory(torrent.hash, category);
        }
      }
    }
  }
}

async function getTorrentTrackers(hash) {
  const uri = `${settings.url}/${API_PATH}/torrents/trackers?hash=${hash}`;

  const response = await getData({
    uri,
    jar: await getCookieJar(),
  });

  return response;
}

async function setTorrentCategory(hash, category) {
  const formData = {
    hashes: hash,
    category,
  };

  await postData({
    uri: `${settings.url}/${API_PATH}/torrents/setCategory`,
    jar: await getCookieJar(),
    formData,
  });
}

async function getData(parameters) {
  try {
    return await rp({ json: true, timeout: 10000000, ...parameters });
  } catch (e) {
    await delay();
    try {
      return await rp({ json: true, timeout: 10000000, ...parameters });
    } catch (e) {
      await console.log(e);
      process.exit();
    }
  }
}

async function postData(parameters) {
  try {
    return await rp.post({ json: true, timeout: 10000000, ...parameters });
  } catch (e) {
    await delay();
    try {
      return await rp.post({ json: true, timeout: 10000000, ...parameters });
    } catch (e) {
      await console.log(e);
      process.exit();
    }
  }
}

(async () => {
  await logger(`getting all uncategorized torrents`);
  const torrents = await getUncategorizedTorrentHashes();
  await logger(`${torrents.length} torrents found`);

  for await (const torrent of torrents) {
    if (torrent.progress != 1) continue;
    await setCategory(torrent);
  }
})();
