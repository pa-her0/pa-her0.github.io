---
title: OrangePi5部署YOLO推理模型
commentSlug: '2025-04-15-YOLO-Orangepi5'
published: 2025-04-15T00:00:00.000Z
draft: false
description: '阐述一下我在 YOLO模型转化 和 开发板上配置踩的坑。 :（'
image: /post-covers/2025-04-15-yolo-orangepi5.jpg
tags:
  - 热爱
category: 开发
lang: zh-CN
---
# YOLO的 pt 模型 转化为 onnx

> 这里有一个 小坑，也是会影响你后面的转化结果。

模型转化用[ultralytics_yolov8](https://github.com/airockchip/ultralytics_yolov8) 这个Github库.

pt 模型直接放到 ultralytics_yolov8路径下，然后输入以下两条指令

```python
export PYTHONPATH=./
python ./ultralytics/engine/exporter.py
```

或者也可以直接调用 进行模型转化

```
yolo export model=yolov8relupt.pt format=rknn
```

> 转化的时候如果显示 yolo 不支持 rknn的格式转化，你就得更新一下yolo（相当于更新 ultralytics库）

无论这两种方法中的哪一种 生成的 onnx模型都需要有 大于一个的检测头。(\*\*这是必须满足的条件，不然后面转化为 rknn 的模型是有问题的)

> 可以使用 netron 这个网站来查看自己的 onnx 模型样子，几个检测头就相当于有几个分支

![](https://s3.bmp.ovh/imgs/2025/06/13/52c4399f85bdb6db.png)

# onnx 转化为 rknn

该操作方法照着 [YOLOv8 部署 rk3588](https://blog.csdn.net/A_l_b_ert/article/details/141610417)进行操作就可以，我操作的时候没有任何问题。

> 在这一步你也需要检查的就是 你到导出 的 rknn模型的检测头（用 netron），有几个输出结果便对应着你 有一个标签。如果检测头只有一个或者过少便是你模型转化有问题，请检查前面步骤是不是存在问题。

# rknn 进行模型推理

这里的操作也是 [YOLOv8 部署 rk3588](https://blog.csdn.net/A_l_b_ert/article/details/141610417)这个博主，他有一个现成的 C++ 调用 NPU的代码可以直接套用，但是他那个代码存在一点缺陷便是，你每一次编译完他那个**读取图片的路径是不能改变**的，建议将他的C++进行调整，将那个 输入的图片的路径 和 输出的图片的路径 作为 运行的 参数调用

> 这里有一个存在的问题就是 CV2 无法读取图片的问题

如果当你遇到了 CV 无法读取图片的问题的时候（这个问题困扰了我10几个小时，在这个途中我尝试了很多其他来调用rknn模型的代码，发现要不是版本不适配要不就是很麻烦 😭 ，差点给 开发板 变成装垃圾的了）

- 图片的尺寸必须和你训练的 **yolo模型**的读取图片的尺寸保持一致，一般来说，yolo的默认读取图片的尺寸是 640\*640
- 图片的后缀名字必须为 png

最后想感谢的就是 RKNN技术论坛的大佬们，帮我能更快的解决我遇到的问题！真的配环境遇到的问题就是给人一种绝望的感觉，还有就是感谢 [YOLOv8 部署 rk3588](https://blog.csdn.net/A_l_b_ert/article/details/141610417)这个博主的教程。

参考网站:

- [YOLOv8 部署 rk3588](https://blog.csdn.net/A_l_b_ert/article/details/141610417)

- [rknn调用的 C++ 代码](https://github.com/A7bert777/YOLOv8_RK3588_object_detect)

## .... 博主模型跑通了，放长假ing
