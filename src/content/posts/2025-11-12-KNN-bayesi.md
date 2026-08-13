---
title: 贝叶斯 AND KNN
commentSlug: '2025-11-12-KNN-bayesi'
published: 2025-11-12T00:00:00.000Z
draft: false
description: 解释一下统计学中的两个通用性模型
image: /post-covers/2025-11-12-knn-bayesi.jpg
tags:
  - 日常学习
category: 学习
lang: zh-CN
---
## 贝叶斯网络

> [!NOTE]
> 贝叶斯网络 也称作 贝叶斯有向无环图或者概率依赖网络。

### 核心概念

预先知识:
核心公式: 贝叶斯定理

$$
P(B|A) = \frac{P(AB)}{P(A)}
$$

1. 贝叶斯的相关应用

- Google的检查(通过概率分布给出频率最高的可能结果)

正式开始:
贝叶斯网络又称 有向无环图模型,是一种概率图模型

1. 贝叶斯网络中的有向无环图的基本特征
   节点表示**随机变量**${X_1,X_2...X_n}$
   边表示: **因果关系**,$A \rightarrow B$ 表示在 A 的基础上 B发生的概率

2. 联合概率分布

   $$
   P(x_1,...,x_k) = P(x_k | x_1,...,x_{k-1})P(x_2|x_1)P(x_1)
   $$

3. 贝叶斯网络的结构形式
   ![](/img/beiyesi.png)
   (1) head-to-head
   两个不相关的节点相对独立
   (2) tail-to-tail
   两个不相关的节点都由一个节点进行 控制
   (3) head_to_tail
   每一个节点状态只与上一个节点有关
   这种链式网络,每一个节点的状态只与上一个状态有关,这个过程可以叫做马尔可夫链

### 因子图

在因子图中:**顶点是函数节点,边线表示它们之间的函数关系**
其实就是 变量和函数关系的概率图
举个例子:

$$
g(x_1,x_2,x_3,x_4,x_5) = F_A(x_1)F_B(x_2)F_C(x_1,x_2,x_3)F_D(x_3,x_4)F_E(x_3,x_5)
$$

![](/img/yinzitu1.png)
![](/img/yinzitu2.png)

### Sum-product 算法

> [!NOTE]
> 这个算法我感觉可以理解成算法中的递归思路,就是我将一个函数拆分成很多小函数,然后再吧小函数的值进行聚合成最终结果

#### 核心思想

![](/img/sumproduct1.png)

我们可以通过提取公因子得到

![](/img/sumproduct2.png)

然后根据下面的图像的公式可得,我们可以拆分计算然后进行汇总

![](/img/sumproduct3.png)

#### Sum-product算法的总体框架

1. 这个一个因子图的例子
   ![](/img/sumproduct4.png)
2. 下面是 **sum-product**算法的消息计算规则
   ![](/img/sumproduct5.png)
3. 根据 sum-product 定理,下面就是关于 X 的概率
   ![](/img/sumproduct6.png)

### 相关代码实现

#### 高斯朴素贝叶斯模型

```py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import GaussianNB

#1. 读入数据
df = pd.read_csv('UniversalBank.csv')
## 进行特征划分和标签设置
y = df['Personal Loan']
X = df.drop(['ID', 'ZIP Code', 'Personal Loan'], axis = 1)

## 进行数据集划分
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state = 0)

#2. 训练高斯朴素贝叶斯模型
gnb = GaussianNB()
## 训练数据集(X_train,y_train)
gnb.fit(X_train, y_train)

# 3. 评估模型
## 对测试集进行分类预测
y_pred = gnb.predict(X_test)
## 返回预测准确率
acc = gnb.score(X_test, y_test)
print('GaussianNB模型的准确度: %s'%acc)

y_pred = gnb.predict_proba(X_test)
print('测试数据对象0的预测结果（概率）:', y_pred[0])
```

进行参数调整,观察数据集中,上面代码使用的特征是 ID,ZIP Code,Personal Loan,我感觉可以多增加特征值,看能否提高预测准确率
实验表明,增加特征值会**提高准确率**,修改部分(也可以修改标签,但是二分类标签一般不好修改,或者修改数据集划分,但是常用数据集划分就是7:3)

```py
1. X = df.drop(['ID', 'ZIP Code', 'Personal Loan','CCAvg','Income'], axis = 1)
```

![](/img/test1.png)

#### 多项式朴素贝叶斯模型

```py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB

# 1. 读入数据
df = pd.read_csv('UniversalBank.csv')
y = df['Personal Loan']
X = df[['Family', 'Education', 'Securities Account',
'CD Account', 'Online', 'CreditCard']]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size = 0.3, random_state = 0)

#2. 训练多项式朴素贝叶斯模型
mnb = MultinomialNB()
mnb.fit(X_train, y_train)

acc = mnb.score(X_test, y_test)
print('MultinomialNB模型的准确度: %s'%acc)
```

跟上面的修改一致,只是这一次我们可以减少特征值,但是精确度没有变化(不理解)
![](/img/test2.png)

## K近邻算法

> [!NOTE]
> 一种基本分类和回归的方法

### 概念

![](/img/k-nn1.png)
给定一个训练数据集,对新的输入实例,在训练数据集中找到与这实例最邻近的K个例,这K个实例多数属于某一个类别,就把这个输入实例分类到这个类中

核心流程:
就是每输入一个实例,然后进行距离计算,选取前 K 个实例,然后计算属于每一个类别的概率

### 核心结构

#### 距离的度量

![](/img/k-nn2.png)

#### 归一化

为了防止部分特征的权重过大,从而弱化其他特征,我们要进行归一化
![](/img/k-nn3.png)

### 核心代码实现

```py
# -*- coding: utf-8 -*-
"""
Created on Thu Mar  2 10:25:47 2023

@author: 数据挖掘课程组
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier

# 1. 建立数据集
df = pd.read_csv('UniversalBank.csv')
y = df['Personal Loan']
X = df.drop(['ID', 'ZIP Code', 'Personal Loan'], axis = 1)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size = 0.3, random_state = 0)
n_neighbors = 10                              #K值

# 2. 采用两种weights参数建立KNN模型，并评估
for weights in ['uniform', 'distance']:
    knn = KNeighborsClassifier(n_neighbors, weights = weights)
    knn.fit(X_train, y_train)

    acc = knn.score(X_test, y_test)
print('%s 准确度:  %s'%(weights, acc))
```

和 贝叶斯的实现差不多,就是 n_neighbors 就是 K 的数量,选择 K 的数量

1. 我对 K 进行调整,将 K 变成 10,精度有所提高
   ![](/img/k-nn4.png)

## 决策树

决策树我的理解就是一个二叉树,就是针对于这个特征的0/1选择

```py
# -*- coding: utf-8 -*-
"""
Created on Mon Feb 27 15:30:58 2023

@author: 数据挖掘课程组
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
np.random.seed(10)

# 1. 建立数据集
df = pd.read_csv('UniversalBank.csv')
y = df['Personal Loan']
X = df.drop(['ID', 'ZIP Code', 'Personal Loan', ], axis = 1)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size = 0.3, random_state = 0)

#2. 使用默认参数训练CART模型
model1 = DecisionTreeClassifier()
model2 = model1.fit(X_train, y_train)
acc1 = model1.score(X_test, y_test)
print('默认参数的CART决策树的准确度: \n', acc1)

# 3. 设置sample_weight参数后训练CART模型
sample_weight = np.ones((y_train.shape[0],))
sample_weight[y_train == 1] = np.ceil(sum(y_train == 0) / sum(y_train == 1))

model2 = DecisionTreeClassifier(max_depth = 10)   #设置模型的max_depth参数
model2 = model2.fit(X_train, y_train, sample_weight)
acc2 = model2.score(X_test, y_test)
print('设置参数后的CART决策树的准确度:\n', acc2)

#4. 可视化决策树
from sklearn.tree import export_graphviz
import graphviz

dot_data = export_graphviz(model2, out_file = None,
                           feature_names = X.columns,
                           class_names=["0","1"],
                           filled=True)  #指定是否为节点上色
graph = graphviz.Source(dot_data)
graph.render(r'wine')
graph.view()
```

我增加特征后,精度有所上升
![](/img/k-nn5.png)
