const dotenv = require('dotenv');
dotenv.config();

// throw(process.env.OSXSIGN_IDENTITY);

module.exports = {
  packagerConfig: {
    asar: true,
    osxSign: {
      identity: process.env.OSXSIGN_IDENTITY
    } // object must exist even if empty
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-dmg',
      config: {},
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};
