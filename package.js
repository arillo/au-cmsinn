Package.describe({
  summary: "Practical, simple and yet powerful CMS solution for meteor projects",
  version: "0.1.0",
  git: "https://github.com/SteelzZ/au-cmsinn.git",
  homepage: "https://github.com/SteelzZ/au-cmsinn",
  name: "steelzz:au-cmsinn"
});


Npm.depends({
    'gm': '1.16.0'
});

Package.on_use(function (api, where) {
    var client, server, both;

    client = 'client';
    server = 'server';
    both = [client, server];

    api.imply([
        'iron:router',
        'alanning:roles'
    ]);

    api.use([
        'coffeescript@1.0.5',
        'underscore@1.0.0',
        'ui@1.0.2',
        'iron:router@1.0.0',
        'tracker@1.0.2',
        'templating@1.0.6',
        'alanning:roles@1.2.12',
        'jag:pince',
        'mrt:allow-env'
    ], both);
    
    api.use([
        'jquery@1.0.0',
        'mrt:jquery-ui@1.9.2',
        'matteodem:hallo@1.0.4',
        'gfk:notifications@1.1.2',
        'mystor:device-detection@0.2.0'
    ], client);

    // both
    api.addFiles([
        'lib/storage/remote-collection-storage.coffee',
        'lib/plugins/core.coffee',
        'lib/utils.coffee',
        'lib/plugins/ironrouter.coffee',
        'lib/plugins/image.coffee',
        'lib/plugins/locale.coffee',
        'lib/plugins/record.coffee',
        'lib/plugins/sortable.coffee',
        'lib/plugins/deletable.coffee',
        'lib/plugins/navigation.coffee',
        'lib/plugins/versioning.coffee',
        'lib/plugins/label.coffee',
        'lib/plugins/rolesmanager.coffee',
        'lib/plugins/settings.coffee',
        'lib/models/content.coffee',
        'lib/service.coffee'
    ], both);

    // client

    // styles
    api.addFiles([
        'client/css/icons.css',
        'client/css/main.css',
        'client/css/hallo.css'
    ], client);

    // helpers
    api.addFiles([
        'client/helpers/load_plugin.coffee'
    ], client);

    // CMS plugins

    // record plugin
    api.addFiles([
        'client/plugins/cms_record/cms_record.html',
        'client/plugins/cms_record/cms_record.coffee'
    ], client);

    // rolesmanager plugin
    api.addFiles([
        'client/plugins/cms_rolesmanager/cms_rolesmanager.html',
        'client/plugins/cms_rolesmanager/cms_rolesmanager.coffee'
    ], client);

    // settings plugin
    api.addFiles([
        'client/plugins/cms_settings/cms_settings.html'
    ], client);

    // controls bar
    api.addFiles([
        'client/views/controls/controls.html',
        'client/views/controls/controls.coffee'
    ], client);

    // 3rd party
    api.addFiles([
        'lib/3rd/jquery.poshytip.coffee',
        'lib/3rd/hallo-enhanced-link.coffee'
    ], client);

    // server
    api.addFiles([
        'server/methods/users.coffee',
        'server/publish/users.coffee'
    ], server);

    // exports
    api.export('CmsInn', both);
    api.export('Notifications', client);

    // test
    api.export('RemoteCollectionStorageAdapter', both, {testOnly: true});
    api.export('AuCmsInn', both, {testOnly: true});
    api.export('Utilities', both);
    api.export('CmsInnSortable', both, {testOnly: true});
    api.export('CmsInnRecord', both, {testOnly: true});
    api.export('CmsInnNavigation', both, {testOnly: true});
    api.export('CmsInnLocale', both, {testOnly: true});
    api.export('CmsInnImage', both, {testOnly: true});
    api.export('CmsInnLabel', both, {testOnly: true});
});

Package.on_test(function (api) {
    var client, server, both;

    client = 'client';
    server = 'server';
    both = [client, server];

    api.use('steelzz:au-cmsinn', both);

    api.use(['jquery@1.0.0', 'mrt:jquery-ui@1.9.2'], client);
    api.use(['steelzz:mocha-web-sinon@0.1.6'], both);
    api.use('tinytest@1.0.0', both);
    api.use('test-helpers@1.0.0', both);
    api.use('accounts-base@1.0.0', both);
    api.use('accounts-password@1.0.0', both);

    api.add_files('test/test_helpers.js', both);

    api.add_files('test/lib/service.test.js', both);
    api.add_files('test/lib/utils.test.js', both);
    api.add_files('test/lib/plugins/sortable.test.js', both);
    api.add_files('test/lib/plugins/record.test.js', both);
    api.add_files('test/lib/plugins/navigation.test.js', both);
    api.add_files('test/lib/plugins/locale.test.js', both);
    api.add_files('test/lib/plugins/image.test.js', both);
    api.add_files('test/lib/plugins/label.test.js', both);
});
