# Devine Graduation Videowall

## Computer Setup

### macOS

- System Preferences > Mission Control > Uncheck "Displays have separate spaces"
- System Preferences > Dock & Menu Bar > Automatically hide and show the menu bar on desktop

## SQLite to Postgres

Conversion happens using the sequel Ruby GEM. Make sure to have an up-to-date Ruby installation first: (based upon https://www.moncefbelyamani.com/how-to-install-xcode-homebrew-git-rvm-ruby-on-mac/#start-here-if-you-choose-the-long-and-manual-route)

1. Install homebrew (if not yet installed)
2. Install chruby and ruby-install:

```
brew install chruby ruby-install xz
```

3. Install the latest stable version of Ruby. Note the version it installed (eg 3.1.2):

```
ruby-install ruby
```

4. Update your shell profile (you might have installed a different version in step 3):

```
echo "source $(brew --prefix)/opt/chruby/share/chruby/chruby.sh" >> ~/.zshrc
echo "source $(brew --prefix)/opt/chruby/share/chruby/auto.sh" >> ~/.zshrc
echo "chruby ruby-3.1.2" >> ~/.zshrc
```

Make sure to install the libpq homebrew package, which contains the necessary headers for the postgres ruby gem:

```
brew install libpq
```

Add it to your path:

```
echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc
```

Once you have a version-managed-ruby installation, install the sequel gem:

```
gem install sequel
gem install sqlite3
gem install pg
```

mysql gem:

```
brew link mariadb
gem install mysql2 -- --with-mysql-config=/opt/homebrew/Cellar/mariadb/10.8.3_1/bin/mysql_config --with-ldflags=-L/opt/homebrew/opt/openssl/lib --with-cppflags=-I/opt/homebrew/opt/openssl/include
```


Convert the sqlite to postgres (https://sequel.jeremyevans.net/rdoc/files/doc/bin_sequel_rdoc.html)

```
sequel -C sqlite://db/data.db postgres://postgres:devine4life@localhost/strapi_videowall
```

To sql dump:
```
sequel -C postgres://postgres:devine4life@localhost/strapi_videowall mock://mysql -E > migration.sql               
```

### Postgres fix date query

Some dates have an invalid year (ev 54152-10-17 17:17:06). Use the following UPDATE queries to fix those:

```
UPDATE admin_permissions SET created_at = created_at + MAKE_INTERVAL(YEARS := 2020 - EXTRACT(YEAR FROM created_at)::INTEGER)
UPDATE admin_permissions SET updated_at = updated_at + MAKE_INTERVAL(YEARS := 2020 - EXTRACT(YEAR FROM updated_at)::INTEGER)
UPDATE admin_roles SET created_at = created_at + MAKE_INTERVAL(YEARS := 2020 - EXTRACT(YEAR FROM created_at)::INTEGER)
UPDATE admin_roles SET updated_at = updated_at + MAKE_INTERVAL(YEARS := 2020 - EXTRACT(YEAR FROM updated_at)::INTEGER)
UPDATE i18n_locale SET created_at = created_at + MAKE_INTERVAL(YEARS := 2020 - EXTRACT(YEAR FROM created_at)::INTEGER)
UPDATE i18n_locale SET updated_at = updated_at + MAKE_INTERVAL(YEARS := 2020 - EXTRACT(YEAR FROM updated_at)::INTEGER)
UPDATE up_permissions SET created_at = created_at + MAKE_INTERVAL(YEARS := 2020 - EXTRACT(YEAR FROM created_at)::INTEGER)
UPDATE up_permissions SET updated_at = updated_at + MAKE_INTERVAL(YEARS := 2020 - EXTRACT(YEAR FROM updated_at)::INTEGER)
UPDATE up_roles SET created_at = created_at + MAKE_INTERVAL(YEARS := 2020 - EXTRACT(YEAR FROM created_at)::INTEGER)
UPDATE up_roles SET updated_at = updated_at + MAKE_INTERVAL(YEARS := 2020 - EXTRACT(YEAR FROM updated_at)::INTEGER)
```

## recompress videos

```
#/bin/bash
find . -name *.mp4 -exec ffmpeg -i {} -c:v libx264 -preset slow -crf 15 -c:a copy {}-recompressed.mp4 \;
```

## GraphQL query for data

Get the data out of strapi using graphql: http://localhost:1337/graphql
See Application.js for the query.

## assets sync

Sync the assets from local strapi to this project:

```
rsync -a ../devine-graduation-videowall-strapi/public/uploads/ ./public/uploads/
```