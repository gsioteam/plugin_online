import 'dart:convert';
import 'dart:html';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_dapp/flutter_dapp.dart';
import 'package:plugin_online/utils/plugin.dart';
import 'package:xml_layout/types/icons.dart' as icons;
import 'ext_page.dart';
import 'utils/assets_filesystem.dart';
import 'utils/image_providers.dart';
import 'utils/js_setup.dart';
import 'utils/no_data.dart';
import 'utils/search_page_route.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        primaryColor: Colors.blue,
      ),
      home: Splash(),
    );
  }
}

class Splash extends StatefulWidget {
  @override
  State<StatefulWidget> createState() => _SplashState();
}

class _SplashState extends State<Splash> {
  @override
  Widget build(BuildContext context) {
    return Container();
  }

  @override
  void initState() {
    super.initState();

    _setup();
  }

  Future<void> _setup() async {
    // AssetsFileSystem fileSystem  = AssetsFileSystem(
    //   context: context,
    //   prefix: 'assets/test/'
    // );
    // await fileSystem.ready;

    await initializeSetupJS(context);

    icons.register();

    Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (context) {
      return Home();
    }), (route) => route.isCurrent);
  }
}

class Home extends StatefulWidget {
  final DappFileSystem? fileSystem;

  Home({
    Key? key,
    this.fileSystem
  }) : super(key: key);

  @override
  _HomeState createState() => _HomeState();
}

class MemoryFileSystem extends DappFileSystem {

  Map<String, Uint8List> _map = {};

  MemoryFileSystem(List data) {
    for (Map item in data) {
      String path = item['path'];
      Uint8List buffer = item['buffer'];

      if (path[0] != '/') {
        path = '/$path';
      }
      _map[path] = buffer;
    }
  }

  @override
  bool exist(String filename) => _map.containsKey(filename);

  @override
  String? read(String filename) {
    var buf = readBytes(filename);
    if (buf != null) {
      return utf8.decode(buf);
    }
  }

  @override
  Uint8List? readBytes(String filename) => _map[filename];
  
}

const double _LogoSize = 32;
class _HomeState extends State<Home> {
  Plugin? plugin;

  @override
  Widget build(BuildContext context) {
    if (plugin?.isValidate == true) {
      return Scaffold(
        appBar: AppBar(
          title: _buildLogo(context),
          actions: _buildActions(),
          elevation: plugin!.information!.appBarElevation,
        ),
        body: _buildBody(),
      );
    } else {
      return Scaffold(
        appBar: AppBar(
          title: _buildLogo(context),
          actions: _buildActions(),
        ),
        body: _buildBody(),
      );
    }
  }

  @override
  void dispose() {
    super.dispose();

  }
  
  @override
  void initState() {
    super.initState();

    window.postMessage({
      "type": "ready",
    }, "*");
    window.onMessage.listen((event) {
      if (event.data['type'] == 'files') {
        List data = event.data['data'];

        setState(() {
          plugin = Plugin(MemoryFileSystem(data));
        });
      }
    });

    // plugin = Plugin(widget.fileSystem);
  }

  List<GlobalKey> _keys = [];
  List<Widget> _buildActions() {
    List<Widget> actions = [];
    var extensions = plugin?.information?.extensions;

    if (extensions != null) {
      for (int i = 0, t = extensions.length; i < t; ++i) {
        var extension = extensions[i];
        if (_keys.length <= i) {
          _keys.add(GlobalKey());
        }
        GlobalKey key = _keys[i];
        actions.add(IconButton(
          key: key,
          icon: Icon(extension.getIconData()),
          onPressed: () {
            RenderObject? object = key.currentContext?.findRenderObject();
            var translation = object?.getTransformTo(null).getTranslation();
            var size = object?.semanticBounds.size;
            Offset center;
            if (translation != null) {
              double x = translation.x,
                  y = translation.y;
              if (size != null) {
                x += size.width / 2;
                y += size.height / 2;
              }
              center = Offset(x, y);
            } else {
              center = Offset(0, 0);
            }

            Navigator.of(context).push(SearchPageRoute(
                center: center,
                builder: (context) {
                  return ExtPage(
                    plugin: plugin!,
                    entry: extension.index,
                  );
                }
            ));
          },
        ));
      }
    }
    return actions;
  }

  Widget _buildLogo(BuildContext context) {
    return InkWell(
      highlightColor: Theme.of(context).primaryColor,
      child: Container(
        height: 36,
        child: Row(
          children: [
            CircleAvatar(
              radius: _LogoSize / 2,
              backgroundColor: Theme.of(context).colorScheme.background,
              child: ClipOval(
                child: plugin == null ?
                Icon(
                  Icons.extension,
                  size: _LogoSize * 0.66,
                  color: Theme.of(context).colorScheme.onBackground,
                ) : pluginImage(
                  plugin,
                  width: _LogoSize,
                  height: _LogoSize,
                  fit: BoxFit.contain,
                  errorBuilder: (context, e, stack) {
                    return Container(
                      width: _LogoSize,
                      height: _LogoSize,
                      child: Center(
                        child: Icon(
                          Icons.broken_image,
                          color: Theme.of(context).colorScheme.onBackground,
                          size: 16,
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: 12,
                ),
                child: Text(plugin?.information?.name ?? 'select_project'),
              ),
            ),
          ],
        ),
      ),
      onTap: () async {
      },
    );
  }

  Widget _buildBody() {
    if (plugin == null) {
      return Stack(
        children: [
          Positioned.fill(child: NoData()),
        ],
      );
    } else {
      String index = plugin!.information!.index;
      if (index[0] != '/') {
        index = '/' + index;
      }
      return DApp(
        entry: index,
        fileSystems: [plugin!.fileSystem],
        onInitialize: (script) {
          setupJS(script);

        },
      );
    }
  }
}
