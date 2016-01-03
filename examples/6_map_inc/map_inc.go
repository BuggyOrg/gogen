
package main

import "sync"
import "../lib/io"
import "../lib/numbers"
import "../lib/conversion"
import "../lib/collection"

func main() {
  stdout := make(chan string)
  stdin := make(chan string)

  var wg sync.WaitGroup
  wg.Add(1)
  go io.Stdout(stdout, wg)
  go io.Stdin(stdin, wg)

  c1 := make(chan []int) // String2IntArray >> Unpack
  c2 := make(chan chan int) // Unpack >> ... Increase
  c3 := make(chan chan int) // ... Increase >> Pack
  c4 := make(chan []int) // Pack >> IntArray2String
  
  go conversion.String2IntArray(stdin, c1)
  go collection.Unpack(c1, c2)
  
  // handle channel channel in own process
  go func() {
    // for every channel (every array that goes into unpack)
    for c21 := range c2 {
      // start a routine to avoid interference
      go func() {
        // this is the result for this channel
        c22 := make(chan int)
        c3 <- c22
        go numbers.Increment(c21, c22)
      }()
    }
  }()
  
	go collection.Pack(c3, c4)
  go conversion.IntArray2String(c4, stdout)

  wg.Wait()
}