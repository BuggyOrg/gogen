/**
   MergeSort
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|                                                            +---------+                                       |
|                                                      +---->+Mergesort+---+                                   |
|                                          +-------+   |     +---------+   |     +---------+                   |
| array                     +-------+      | Merge +---+                   +---->+         |                   |
+--+----------------------->+       +----->+ Split |                             |  Merge  +--+                |
|  |                        | Demux |      |       +---+                   +---->+         |  |                |
|  |   +---+            +-->+       +--+   +-------+   |     +---------+   |     +---------+  |                |
|  +-->+len+-+ +----+   |   +-------+  |               +---->+Mergesort+---+                  |  +------+      |
|      +---+ +>+    |   |              |                     +---------+                      +->+      |      | sorted
|              | >  +---+              |                                                         | Join +----->+
|      +-+  +->+    |                  +-------------------------------------------------------->+      |      |
|      |1+--+  +----+                                                                            +------+      |
|      +-+                                                                                                     |
|                                                                                                              |
|                                                                                                              |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+

  MergeSplit
+------------------------------------------------------------+
|                                                            |
|  +------+        +-----+    +----------+                   |
+->+Unpack+--+---->+:item+--->+          |      +----+       |
|  +------+  |     +-----+    |          +----->+Pack+------>+
|            |                |          |      +----+       |
|            |     +-----+    |  Demux   |                   |
|            +---->+:idx +--->+    by    |                   |
|            |     +-----+    |   Half   |      +----+       |
|            |                |          +----->+Pack+------>+
|            |     +-----+    |          |      +----+       |
|            +---->+:len +--->+          |                   |
|                  +-----+    +----------+                   |
|                                                            |
+------------------------------------------------------------+



   DemuxByHalf
+---------------------------------------------------------+
|                                                         |
| item                                 +-------+  first   |
+------------------------------------->+       +--------->+
|                                      | Demux |          |
|                                 +--->+       +--------->+
|                                 |    +-------+  second  |
|                                 |                       |
| idx                     +---+   |                       |
+------------------------>+   |   |                       |
|                         | > +---+                       |
|                     +-->+   |                           |
| len       +-----+   |   +---+                           |
+---------->+     |   |                                   |
|           | Div +---+                                   |
|  +---+ +->+     |                                       |
|  | 2 +-+  +-----+                                       |
|  +---+                                                  |
|                                                         |
|                                                         |
+---------------------------------------------------------+


    Merge
+----------------------------------------------------------------------------------------------------+
|              +-------------------------------------------------------+                             |
|              |                            +-------+                  |                             |
|     +-----+  |      +----+    +---------->+       |                  |                             |
|     |     +--+  +-->+rest+----+           | Merge |                  |                             |
|     |     |     |   +----+       +------->+       +-+   +--------+   +--------------+              |
+---->+     +-----+          +-----+        +-------+ | +>+        |                  |              |
|     |Skip |     |   +---+  |      +------+       +----+ | Prepend+---+              |              |
|     |If   |     +-->+1st+-------->+      +-------+  +-->+        |   |              |              |
|     |One  |     |   +---+  |      |      |              +--------+   |              |              |
|     |Empty|     |          |      | Low  |                           |    +------+  |  +------+    |
|     |     |     +--------------+  | Fire |                           +--->+      |  +->+      |    |
|     |     |                |   |  |      |                                | Join +-+   | Join |--->|
|     |     |     +----------+   |  |      |                           +--->+      | +-->+      |    |
|     |     |     |   +---+      |  |      |              +--------+   |    +------+     +------+    |
|     |     |     +-->+1st+-------->+      +------------->+        |   |                             |
|     |     |     |   +---+      |  +------+              | Prepend+---+                             |
+---->+     +-----+              |          +-------+ +-->+        |                                 |
|     +-----+     |   +----+     +--------->+       | |   +--------+                                 |
|                 +-->+rest+---+            | Merge +-+                                              |
|                     +----+   +----------->+       |                                                |
|                                           +-------+                                                |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+

   LowFire
+----------------------------------+
|                                  |
|                 +-------+        |
+---+------------>+       +--+     |
|   |             | Demux |        |
|   |          +->+       +------->+
|   |  +---+   |  +-------+        |
|   +->+   |   |                   |
|      | > +---+                   |
|   +->+   |   |  +-------+        |
|   |  +---+ +--->+       +------->+
|   |        | |  | Demux |        |
+---+--------+ +->+       +--+     |
|                 +-------+        |
|                                  |
+----------------------------------+


**/

package main

import "sync"
import "../lib/io"
import "../lib/numbers"
import "../lib/conversion"
import "../lib/collection"
import "../lib/control"

import "fmt"

func logIA(prefix string, ch chan []int) chan []int{
  out := make(chan []int)
  go func(){
    for i := range out {
      fmt.Println(prefix, i)
      ch <- i
    }
    close(ch)
  }()
  return out
}

func logB(prefix string, ch chan bool) chan bool{
  out := make(chan bool)
  go func(){
    for i := range out {
      fmt.Println(prefix, i)
      ch <- i
    }
    close(ch)
  }()
  return out
}

func logInIA(prefix string, ch chan []int) chan []int {
  out := make(chan []int)
  go func(){
    for i := range ch {
      fmt.Println(prefix, i)
      out <- i
    }
    close(out)
  }()
  return out
}

func LowFire(a chan int, b chan int, lowA chan int, lowB chan int) {
  c1 := make(chan int) // Duplicate:1_1 -> Demux:1_1
  c2 := make(chan int) // Duplicate:1_2 -> Greater_1
  c3 := make(chan int) // Duplicate:2_1 -> Greater_2
  c4 := make(chan int) // Duplicate:2_2 -> Demux:2_1
  c5 := make(chan bool) // Greater -> Duplicate:3
  c6 := make(chan bool) // Duplicate:3_1 -> Demux:1_2
  c7 := make(chan bool) // Duplicate:3_2 -> Demux:2_2
  c8 := make(chan int) // Demux:1_1 -> Consume:1
  c9 := make(chan int) // Demux:2_2 -> Consume:2
  
  go control.Duplicate(a, c1, c2)
  go control.Duplicate(b, c3, c4)
  go numbers.Greater(c2, c3, c5)
  go control.DuplicateBool(c5, c6, c7)
  go control.Demux(c1, c6, c8, lowA)
  go control.Demux(c2, c7, lowB, c9)
  go control.Consume(c8)
  go control.Consume(c9)
}

var cnt int

func OneEmpty(a chan []int, b chan []int, choice chan bool, skip chan []int) {
  c1 := make(chan []int) // Duplicate_1 -> Choice_1
  c2 := make(chan []int) // Duplicate_2 -> Empty
  c3 := make(chan bool) // Empty -> Choice_3
  c4 := make(chan []int) // Choice -> Demux_1
  c5 := make(chan []int) // Demux_1 -> Consume
  
  go control.DuplicateIntArray(a, c1, c2)
  go collection.Empty(c2, c3)
  go control.ChoiceIntArray(a, b, c3, c4)
  go control.DemuxIntArray(c4, choice, c5, skip)
  go control.ConsumeIntArray(c5)
}

func Both(a chan []int, b chan []int, choice chan bool, aOut chan []int, bOut chan []int) {
  c1 := make(chan bool) // Duplicate_1 -> Demux:1_2
  c2 := make(chan bool) // Duplicate_2 -> Demux:2_2
  c3 := make(chan []int) // Demux:1_2 -> Consume:1
  c4 := make(chan []int) // Demux:2_2 -> Consume:2
  
  go control.DuplicateBool(choice, c1, c2)
  go control.DemuxIntArray(a, c1, aOut, c3)
  go control.DemuxIntArray(b, c2, bOut, c4)
  go control.ConsumeIntArray(c3)
  go control.ConsumeIntArray(c4)
}

func SkipIfOneEmpty(a1 chan []int, a2 chan []int, skip chan []int, a1out chan []int, a2out chan []int) {
  c1 := make(chan []int) // Duplicate:1_1 -> Duplicate:3
  c2 := make(chan []int) // Duplicate:1_2 -> Empty:1
  c3 := make(chan []int) // Duplicate:2_1 -> Empty:2
  c4 := make(chan []int) // Duplicate:2_2 -> Duplicate:4
  c5 := make(chan bool) // Empty:1 -> Not:1
  c6 := make(chan bool) // Empty:2 -> Not:2
  c7 := make(chan bool) // Not:1 -> And_1
  c8 := make(chan bool) // Not:2 -> And_2
  c9 := make(chan bool) // And -> Duplicate:5
  c10:= make(chan []int) // Duplicate:3_1 -> Both_1
  c11:= make(chan []int) // Duplicate:3_2 -> OneEmpty_1
  c12:= make(chan []int) // Duplicate:4_1 -> Both_2
  c13:= make(chan []int) // Duplicate:4_2 -> OneEmpty_2
  c14:= make(chan bool) // Duplicate:5_1 -> Both_3
  c15:= make(chan bool) // Duplicate:5_2 -> OneEmpty_3
  
  go control.DuplicateIntArray(a1, c1, logIA("sioe1: ",c2))
  go control.DuplicateIntArray(a2, c3, logIA("sioe2: ", c4))
  go collection.Empty(c2, c5)
  go collection.Empty(c3, c6)
  go control.Not(c5, c7)
  go control.Not(c6, c8)
  go control.And(c7, c8, logB("And : ", c9))
  go control.DuplicateIntArray(c1, c10, c11)
  go control.DuplicateIntArray(c4, c12, c13)
  go control.DuplicateBool(c9, c14, c15)
  go Both(c10, c12, c14, a1out, a2out)
  go OneEmpty(c11, c13, c15, skip)  
}

func Merge(a1 chan []int, a2 chan []int, merged chan []int) {
  for {
    a1Arr := <- a1
    a2Arr := <- a2
    cur := cnt
    cnt = cnt + 2
    
    c00:= make(chan []int)
    c01:= make(chan []int)
    c02:= make(chan []int) // SkipIfOneEmpty_1 -> Join:2_1
    c03:= make(chan []int) // SkipIfOneEmpty_2 -> Duplicate:1
    c04:= make(chan []int) // SkipIfOneEmpty_3 -> Duplicate:3
    c1 := make(chan []int) // Duplicate:1_1 -> Duplicate:2
    c2 := make(chan []int) // Duplicate:1_2 -> Merge:2_1
    c3 := make(chan []int) // Duplicate:2_1 -> Rest:1
    c4 := make(chan []int) // Duplicate:2_2 -> First:1
    c5 := make(chan []int) // Duplicate:3_1 -> Duplicate:4
    c6 := make(chan []int) // Duplicate:3_2 -> Rest:2
    c7 := make(chan []int) // Duplicate:4_1 -> Merge:1_2
    c8 := make(chan []int) // Duplicate:4_2 -> First:2
    c9 := make(chan []int) // Rest:1 -> Merge:1_1
    c10:= make(chan int) // First:1 -> LowFire_1
    c11:= make(chan int) // First:2 -> LowFire_2
    c12:= make(chan []int) // Rest:2 -> Merge:2_2
    c13:= make(chan int) // LowFire_1 -> Prepend:1_1
    c14:= make(chan int) // LowFire_2 -> Prepend:2_1
    c15:= make(chan []int) // Merge:1 -> Prepend:1_2
    c16:= make(chan []int) // Merge:2 -> Prepend:2_2
    c17:= make(chan []int) // Prepend:1 -> Join:1_1
    c18:= make(chan []int) // Prepend:2 -> Join:1_2
    c19:= make(chan []int) // Join:1 -> Join:2_2
    
    go SkipIfOneEmpty(c00, c01, c02, c03, c04)
    go control.DuplicateIntArray(c03, c1, c2)
    go control.DuplicateIntArray(c1, c3, c4)
    go control.DuplicateIntArray(c04, c5, c6)
    go control.DuplicateIntArray(c5, c7, c8)
    go collection.Rest(c3, c9)
    fmt.Println("Merging : ", a1Arr, a2Arr)
    go collection.First(c4, c10, cur)
    go collection.First(c8, c11, cur+1)
    go collection.Rest(c6, logIA("rest: ", c12))
    go LowFire(c10, c11, c13, c14)
    go Merge(c9, c7, c15)
    go Merge(c2, c12, c16)
    go collection.Prepend(c13, c15, c17)
    go collection.Prepend(c14, c16, c18)
    go control.JoinIntArr(c17, c18, logIA("premerged: ", c19))
    go control.JoinIntArr(c02, c19, logIA("merged: ", merged))
    
    c00 <- a1Arr
    c01 <- a2Arr
  }
}

func DemuxByHalf(item chan int, idx chan int, len chan int, first chan int, second chan int) {
  c1 := make(chan int) // Constant -> Divide_2
  c2 := make(chan int) // Divide -> Greater_2
  c3 := make(chan bool) // Greater -> Demux_2
  
  go numbers.Constant(2)(c1)
  go numbers.Divide(len, c1, c2)
  go numbers.GreaterEqual(idx, c2, c3)
  go control.Demux(item, c3, first, second)
}

func MergeSplit(input chan []int, part1 chan []int, part2 chan []int) {
  c1 := make(chan chan int) // Unpack_item -> DemuxByHalf_1
  c2 := make(chan chan int) // Unpack_index -> DemuxByHalf_2
  c3 := make(chan chan int) // Unpack_length -> DemuxByHalf_3
  c5 := make(chan chan int) // DemuxByHalf_1 -> Pack:1
  c6 := make(chan chan int) // DemuxByHalf_2 -> Pack:2
  
  go collection.UnpackFull(input, c1, c2, c3)
  
  go func() {
    for {
      c11 := <- c1
      c21 := <- c2
      c31 := <- c3
      c51 := make(chan int)
      c61 := make(chan int)
      fmt.Println("mergeSplit")
      
      go DemuxByHalf(c11, c21, c31, c51, c61)
      
      c5 <- c51
      c6 <- c61
    }
  }()
  
  go collection.Pack(c5, part1)
  go collection.Pack(c6, part2)  
 }

func MergeSort(stream chan []int, sorted chan []int) {
  for s := range stream {
    c0 := make(chan []int)
    c1 := make(chan []int) // Duplicate:1_1 -> Demux
    c2 := make(chan []int) // Duplicate:1_2 -> Length
    c3 := make(chan int) // Length -> Greater_1
    c4 := make(chan int) // Constant(1) -> Greater_2
    c5 := make(chan bool) // Greater -> Demux
    c6 := make(chan []int) // Demux_1 -> MergeSplit
    c7 := make(chan []int) // Demux_2 -> Join_2
    c8 := make(chan []int) // MergeSplit_1 -> Mergesort:1
    c9 := make(chan []int) // MergeSplit_2 -> Mergesort:2
    c10:= make(chan []int) // Mergesort:1 -> Merge_1
    c11:= make(chan []int) // Mergesort:2 -> Merge_2
    c12:= make(chan []int) // Merge -> Join_1
    csorted := make(chan []int)
    
    fmt.Println("new data of length : ", len(s), " of ", s)
    
    go control.DuplicateIntArray(c0, c1, c2)
    go collection.Length(c2, c3)
    go numbers.Constant(1)(c4)
    go numbers.Greater(c3, c4, c5)
    go control.DemuxIntArray(c1, c5, c6, c7)
    go MergeSplit(c6, c8, c9)
    go MergeSort(c8, c10)
    go MergeSort(c9, c11)
    go Merge(c10, c11, c12)
    go control.JoinIntArr(c12, c7, csorted)
    
    c0 <- s
    
    so := <- csorted
    fmt.Println("result mergeSort: ", so)
    sorted <- so
  }
}

func main() {
  stdout := make(chan string)
  stdin := make(chan string)

  var wg sync.WaitGroup
  wg.Add(1)
  go io.Stdout(stdout, wg)
  go io.Stdin(stdin, wg)

  c1 := make(chan []int) // String2IntArray >> MergeSort
  c2 := make(chan []int) // MergeSort >> IntArry2String
  
  go conversion.String2IntArray(stdin, logIA("input: ", c1))
  go MergeSort(c1, c2)
  go conversion.IntArray2String(c2, stdout)

  wg.Wait()
}