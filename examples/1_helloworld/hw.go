// from stdout!'Hello World' → STOP

package main

import "sync"
import "../lib/io"

func main(){
  stdout := make(chan string)

  var wg sync.WaitGroup
  wg.Add(1)
  go io.Stdout(stdout, wg)

  stdout <- "Hello World"
  
  wg.Done()
  
  //close(stdout)
  
  wg.Wait()
}
