
import 'package:flutter/cupertino.dart';
import 'package:flutter_dapp/flutter_dapp.dart';
import 'package:flutter_dapp/extensions/html_parse.dart';

HTMLParser _htmlParser = HTMLParser();

Future<void> initializeSetupJS(BuildContext context) async {
  JsScript script = JsScript();
  await _htmlParser.initialize(context, script);
  script.dispose();
}

setupJS(JsScript script) {
  _htmlParser.attachTo(script);
  script.eval("""
  const _oldFetch = window.fetch;
  window.fetch = function(res, init) {
    try {
      if (typeof res === 'string') {
        var url = new URL(res);
        if (url.protocol) {
          return _oldFetch.call(window, 'https://api.codetabs.com/v1/proxy/?quest=' + res, init);
        }
      }
    } catch (e) {}

    return _oldFetch.call(window, res, init);
  }
  """);
}