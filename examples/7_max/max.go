
package main

import "sync"
import "math"
import "../lib/io"
import "../lib/numbers"
import "../lib/conversion"
import "../lib/collection"
import "../lib/control"

func Max(stream chan []int, max chan int) {
	c2 := make(chan chan int) // Unpack >> ... Max
  c3 := make(chan chan int) // ... Max >> Last
	
 	go collection.Unpack(stream, c2)
  
  // handle channel channel in own process
  go func() {
    // for every channel (every array that goes into unpack)
    for c21 := range c2 {
      // start a routine to avoid interference
      go func() {
        // this is the result for this channel
        c22 := make(chan int)
        c23 := make(chan int)
        c24 := make(chan int)
        c3 <- c24
        go numbers.Biggest(c21, c22, c23)
        go control.Duplicate(c23, c22, c24)
      }()
    }
  }()
  
  go collection.Last(, max)
}

func main() {
  stdout := make(chan string)
  stdin := make(chan string)

  var wg sync.WaitGroup
  wg.Add(1)
  go io.Stdout(stdout, wg)
  go io.Stdin(stdin, wg)

  c1 := make(chan []int) // String2IntArray >> Unpack
  c4 := make(chan int) // Pack >> IntArry2String
  c5 := make(chan []int)
  
  go conversion.String2IntArray(stdin, c1)
  go Max(c1, c4, c5)
  go conversion.Int2String(c4, stdout)
  go conversion.IntArray2String(c5, stdout)

  wg.Wait()
}