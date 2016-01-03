
package control

func Distribute(input chan int, output1 chan int, output2 chan int) {
  for {
    i := <- input
    select {
      case output1 <- i:
      case output2 <- i:
    }
  }
}

func Equals(input chan int, constant chan int, output chan int) {
	for {
		c := <- constant
		i := <- input
		if c == i {
			output <- i
		}
	}
}

func NotEquals(input chan int, constant chan int, output chan int) {
	for {
		c := <- constant
		i := <- input
		if c != i {
			output <- i
		}
	}
}

// takes two streams and joins them into one
func Join(input1 chan int, input2 chan int, output chan int) {
  for {
    select {
      case v1 := <- input1:
        output <- v1
      case v2 := <- input2:
        output <- v2 
    }
  }
}

func JoinIntArr(input1 chan []int, input2 chan []int, output chan []int) {
  for {
    select {
      case v1 := <- input1:
        output <- v1
      case v2 := <- input2:
        output <- v2 
    }
  }
}

func Duplicate(input chan int, output1 chan int, output2 chan int) {
  for {
    i := <- input
    output1 <- i
    output2 <- i
  }
}

func DuplicateBool(input chan bool, output1 chan bool, output2 chan bool) {
  for {
    i := <- input
    output1 <- i
    output2 <- i
  }
}

func DuplicateIntArray(input chan []int, output1 chan []int, output2 chan []int) {
  for {
    i := <- input
    output1 <- i
    output2 <- i
  }
}

func Demux(input chan int, choice chan bool, first chan int, second chan int) {
  for {
    i, ok1 := <- input
    if !ok1 {
      break
    }
    c, ok2 := <- choice
    if !ok2 {
      break
    }
    if c {
      first <- i
    } else {
      second <- i
    }
  }
  close(first)
  close(second)
}

func DemuxIntArray(input chan []int, choice chan bool, first chan []int, second chan []int) {
  for {
    i := <- input
    c := <- choice
    if c {
      first <- i
    } else {
      second <- i
    }
  }
}

func Consume(input chan int) {
  for range input { }
}

// takes a value stream and a comparison stream. If value=comparison it propagates the value on outputEquals
// otherwise it propagates the value on outputNotEquals
func Switch(inputValue chan int, inputComparison chan int, outputEquals chan int, outputNotEquals chan int){
   /* Switch
                +--------+
   ---+-------->+        |
      |         | Equals +-------------->
   -+-|-------->+        |            
    | |         +--------+             
    | |                               
    | |         +--------+            
    | +-------->+  Not   |            
    |           | Equals +-------------->
    +---------->+        |     
                +--------+

 **/
  c1 := make(chan int) // duplicate_1 >> Equals
  c2 := make(chan int) // duplicate_2 >> NotEquals
  c3 := make(chan int) // distribute_1 >> Equals
  c4 := make(chan int) // distribute_2 >> NotEquals
  

  go Duplicate(inputValue, c1, c2) // duplicate c2 onto c3 and c4 (stops blocking after both c3 and c4 can fire)
  go Distribute(inputComparison, c3, c4) // put constant on available channel 6 or 7 (does not care if c6 or c7 blocks)
  go Equals(c1, c3, outputEquals)
  go NotEquals(c2, c4, outputNotEquals)
}