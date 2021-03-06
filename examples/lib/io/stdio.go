
package io

import "fmt"
import "sync"

func Stdout(output chan string, wg* sync.WaitGroup) {
  for str := range(output) {
    fmt.Println(str)
  }
  wg.Done()
}

func Stdin(input chan string, wg sync.WaitGroup) {
  for {
    inputStr := ""
    fmt.Println("waiting for Input")
    _,err := fmt.Scanln(&inputStr)
    if err == nil {
      // fmt.Println("got Input")
      // fmt.Println(inputStr)
      input <- inputStr
    }
  }
}