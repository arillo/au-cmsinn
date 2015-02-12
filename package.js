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
    api.imply(['iron:router']);
    api.imply(['alanning:roles']);

    api.use(['underscore@1.0.0', 'ui@1.0.2', 'iron:router@1.0.0', 'tracker@1.0.2', 'templating@1.0.6', 'alanning:roles@1.2.12','jag:pince','mrt:allow-env'], ['client', 'server']);
    api.use(['jquery@1.0.0', 'mrt:jquery-ui@1.9.2', 'matteodem:hallo@1.0.4', 'gfk:notifications@1.1.2','mystor:device-detection@0.2.0'], ['client']);

    
    api.add_files('lib/storage/remote-collection-storage.js', ['client', 'server']);
    api.add_files('lib/plugins/core.js', ['client', 'server']);

    api.add_files('lib/utils.js', ['client', 'server']);

    api.add_files('lib/3rd/jquery.poshytip.js', ['client']);

    api.add_files('lib/3rd/hallo-enhanced-link.js', ['client']);

    api.add_files('client/views/controls/controls.html', ['client']);
    api.add_files('client/views/controls/controls.js', ['client']);

    api.add_files('client/views/settings/settings.html', ['client']);

    api.add_files('client/views/rolesmanager/rolesmanager.html', ['client']);
    api.add_files('client/views/rolesmanager/rolesmanager.js', ['client']);

    api.add_files('client/css/icons.css', ['client']);
    api.add_files('client/css/main.css', ['client']);
    api.add_files('client/css/hallo.css', ['client']);

    // added iron:router plugin
    api.add_files('lib/plugins/ironrouter.js', ['client', 'server']);

    api.add_files('lib/plugins/image.js', ['client', 'server']);
    api.add_files('lib/plugins/locale.js', ['client', 'server']);
    api.add_files('lib/plugins/record.js', ['client', 'server']);
    api.add_files('lib/plugins/sortable.js', ['client', 'server']);
    api.add_files('lib/plugins/deletable.js', ['client', 'server']);
    api.add_files('lib/plugins/navigation.js', ['client', 'server']);
    api.add_files('lib/plugins/versioning.js', ['client', 'server']);
    api.add_files('lib/plugins/label.js', ['client', 'server']);
    api.add_files('lib/plugins/rolesmanager.js', ['client', 'server']);
    api.add_files('lib/plugins/settings.js', ['client', 'server']);

    api.add_files('lib/models/content.js', ['client', 'server']);

    api.add_files('lib/service.js', ['client', 'server']);

    api.add_files('server/methods/users.js', ['server']);
    api.add_files('server/publish/users.js', ['server']);

    api.export('CmsInn');
    api.export('RemoteCollectionStorageAdapter', ['client', 'server'], {testOnly: true});
    api.export('AuCmsInn', ['client', 'server'], {testOnly: true});
    api.export('Utilities', ['client', 'server']);
    api.export('CmsInnSortable', ['client', 'server'], {testOnly: true});
    api.export('CmsInnRecord', ['client', 'server'], {testOnly: true});
    api.export('CmsInnNavigation', ['client', 'server'], {testOnly: true});
    api.export('CmsInnLocale', ['client', 'server'], {testOnly: true});
    api.export('CmsInnImage', ['client', 'server'], {testOnly: true});

    // New architecture plugins
    api.export('CmsInnLabel', ['client', 'server'], {testOnly: true});
    api.export('CmsInnLabel', ['client', 'server'], {testOnly: true});

    api.export('Notifications', 'client');
});

Package.on_test(function (api) {
    api.use('steelzz:au-cmsinn', ['client', 'server']);

    api.use(['jquery@1.0.0', 'mrt:jquery-ui@1.9.2'], ['client']);
    api.use(['steelzz:mocha-web-sinon@0.1.6'], ['client', 'server']);
    api.use('tinytest@1.0.0', ['client', 'server']);
    api.use('test-helpers@1.0.0', ['client', 'server']);
    api.use('accounts-base@1.0.0', ['client', 'server']);
    api.use('accounts-password@1.0.0', ['client', 'server']);

    api.add_files('test/test_helpers.js', ['client', 'server']);

    api.add_files('test/lib/service.test.js', ['client', 'server']);
    api.add_files('test/lib/utils.test.js', ['client', 'server']);
    api.add_files('test/lib/plugins/sortable.test.js', ['client', 'server']);
    api.add_files('test/lib/plugins/record.test.js', ['client', 'server']);
    api.add_files('test/lib/plugins/navigation.test.js', ['client', 'server']);
    api.add_files('test/lib/plugins/locale.test.js', ['client', 'server']);
    api.add_files('test/lib/plugins/image.test.js', ['client', 'server']);
    api.add_files('test/lib/plugins/label.test.js', ['client', 'server']);
});
