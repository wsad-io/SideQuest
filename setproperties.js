var Command,
    SetPropertiesCommand,
    Protocol,
    extend = function(child, parent) {
        for (var key in parent) {
            if (hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    },
    hasProp = {}.hasOwnProperty;

Command = require('adbkit/lib/adb/command');

Protocol = require('adbkit/lib/adb/protocol');

SetPropertiesCommand = (function(superClass) {
    var RE_KEYVAL;

    extend(SetPropertiesCommand, superClass);

    function SetPropertiesCommand() {
        return SetPropertiesCommand.__super__.constructor.apply(this, arguments);
    }

    RE_KEYVAL = /^\[([\s\S]*?)\]: \[([\s\S]*?)\]\r?$/gm;

    SetPropertiesCommand.prototype.execute = function(command) {
        this._send('shell:setprop ' + command);
        return this.parser.readAscii(4).then(
            (function(_this) {
                return function(reply) {
                    switch (reply) {
                        case Protocol.OKAY:
                            return _this.parser.readAll().then(function(data) {
                                return _this._parseProperties(data.toString());
                            });
                        case Protocol.FAIL:
                            return _this.parser.readError();
                        default:
                            return _this.parser.unexpected(reply, 'OKAY or FAIL');
                    }
                };
            })(this)
        );
    };

    SetPropertiesCommand.prototype._parseProperties = function(value) {
        var match, properties;
        properties = {};
        while ((match = RE_KEYVAL.exec(value))) {
            properties[match[1]] = match[2];
        }
        return properties;
    };

    return SetPropertiesCommand;
})(Command);

module.exports = SetPropertiesCommand;
