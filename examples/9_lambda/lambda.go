package main

import "sync"
import "../lib/io"
import "../lib/numbers"
import "../lib/conversion"

func lambda(output chan func(chan int, chan int, chan int)) {
  for {
    output <- func(in1 chan int, in2 chan int, out chan int){
      for {
        i1,ok1 := <- in1
        if !ok1 {
          close(out)
          return
        }
        i2,ok1 := <- in2
        if !ok1 {
          close(out)
          return
        }
        out <- i1 + i2
      }
      close(out)
    }
  }
  close(output)
}

func partial(val_chan chan int, input_chan chan func(chan int, chan int, chan int), output_chan chan func(chan int, chan int)) {
  for {
    val := <- val_chan
    fn := <- input_chan
    val_fn_chan := make(chan int)
    output_chan <- func(in chan int, out chan int){
      fn (val_fn_chan, in, out)
    }
    val_fn_chan <- val
    close(val_fn_chan)
  }
  close(output_chan)
}

func apply(input chan int, inFn chan func(chan int, chan int), output chan int) {
  for {
    fn,ok1 := <- inFn
    if !ok1 {
      close(output)
      return
    }
    in,ok2 := <- input
    if !ok2 {
      close(output)
      return
    }
    out := make(chan int)
    inCh := make(chan int)
    go fn(inCh, out)

    inCh <- in
    close(inCh)

    o,ok2 := <- out
    if !ok2 {
      break
    }
    output <- o
  }
  close(output)
}

func main(){
  stdout := make(chan string)
  l := make(chan func(chan int, chan int, chan int))
  p := make(chan func(chan int, chan int))
  c := make(chan int)
  in := make(chan int)
  a := make(chan int)

  var wg sync.WaitGroup
  wg.Add(1)
  go lambda(l)
  go numbers.Constant(5)(c)
  go partial(c, l, p)
  go apply(in, p, a)
  go conversion.Int2String(a, stdout)
  go io.Stdout(stdout, &wg)

  in <- 2
  close(in)

  wg.Wait()
}
