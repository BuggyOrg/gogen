
package numbers

import "fmt"

func Increment(input chan int, output chan int) {
  for v := range input {
    output <- v + 1
  }
  close(output)
}

func Decrement(input chan int, output chan int) {
  for v:= range input {
    output <- v - 1
  }
  close(output)
}

func Add(s1 chan int, s2 chan int, output chan int) {
  for {
    // caution! no check if one / both channels are closed
    v1 := <- s1
    v2 := <- s2
    output <- v1 + v2
  }
}

func Multiply(input1 chan int, input2 chan int, output chan int) {
  for {
    // caution! no check if one / both channels are closed
    i1 := <- input1
    i2 := <- input2
    output <- i1 * i2
  }
}

func Divide(input1 chan int, input2 chan int, output chan int) {
  for {
    i1,ok1 := <- input1
    if !ok1 {
      break
    }
    i2,ok2 := <- input2
    if !ok2 {
      break
    }
    
    fmt.Println("Divide!", i1, i2)
    output <- i1 / i2
  }
  close(output)
}

type constantProcess  func(chan int)

func Constant(c int) constantProcess{
  return func(output chan int) {
    for {
      fmt.Println("constant!!", c)
      output <- c
    }
  }
}

func Biggest(input1 chan int, input2 chan int, output chan int) {
  for i2 := range input2 {
    i1, ok := <- input1
    if !ok {
      break
    }
    
    if i1 < i2 {
      output <- i2
    } else {
      output <- i1
    }
  }
  close(output)
}

func Greater(input1 chan int, input2 chan int, output chan bool) {
  for {
    i1,ok1 := <- input1
    if !ok1 {
      break
    }
    i2,ok2 := <- input2
    if !ok2 {
      break
    }
    output <- (i1 > i2)
  }
  close(output)
}