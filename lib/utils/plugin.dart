
import 'dart:convert';

import 'package:flutter/widgets.dart';
import 'package:flutter_dapp/flutter_dapp.dart';
import 'package:xml_layout/status.dart';
import 'package:xml_layout/template.dart';
import 'package:xml_layout/xml_layout.dart';
import 'package:xml/xml.dart' as xml;

class FakeNodeControl with NodeControl {}

class Extension {
  String icon;
  String index;

  Extension(this.icon, this.index);

  IconData? _iconData;

  IconData? getIconData() {
    if (_iconData == null) {
      Status status = Status({});
      NodeControl nodeControl = FakeNodeControl();
      Template template = Template(xml.XmlText(icon));
      var iter = template.generate(status, nodeControl);
      NodeData node = iter.first;
      _iconData = node.t<IconData>();
    }
    return _iconData;
  }
}

class Information {
  late String name;
  late String index;
  String? icon;
  late String processor;
  double? appBarElevation;
  late List<Extension> extensions;

  Information.fromData(dynamic json) {
    name = json['name'];
    index = json['index'];
    icon = json['icon'];
    extensions = [];
    var exs = json['extensions'];
    if (exs != null) {
      for (var ex in exs) {
        extensions.add(Extension(ex['icon'], ex['index']));
      }
    }
    processor = json['processor'];
    if (json['appbar_elevation'] is num)
      appBarElevation = (json['appbar_elevation'] as num).toDouble();
  }
}

class Plugin {
  final DappFileSystem fileSystem;
  Information? _information;
  Information? get information => _information;

  Plugin(this.fileSystem) {
    try {
      var str = fileSystem.read('/config.json')!;
      var json = jsonDecode(str);

      _information = Information.fromData(json);
    } catch (e) {
      print("Can not detect plugin\n$e");
    }
  }

  bool get isValidate => _information != null;
}