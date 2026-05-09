# *This project has been created as part of the 42 curriculum by likitha.*

# Philosophers

## Description

The Philosophers project is an introduction to concurrent programming, multithreading, and synchronization in C using POSIX threads and mutexes.

The program simulates a group of philosophers sitting around a circular table. Each philosopher repeatedly eats, sleeps, and thinks. To eat, a philosopher must acquire two forks represented by mutexes. The simulation ends when a philosopher dies from starvation or when all philosophers have eaten a specified number of meals.

The goal of the project is to understand:

* Thread creation and management
* Race conditions and data synchronization
* Mutexes and shared resource protection
* Deadlock avoidance strategies
* Timing-sensitive concurrent systems

This implementation uses:

* One thread per philosopher
* One mutex per fork
* Additional mutexes for shared state and printing
* A monitor loop running in the main thread to detect death conditions

#Instructions

## Compilation

Compile the project using:

```bash
make
```

Remove object files:

```bash
make clean
```

Remove object files and executable:

```bash
make fclean
```

Recompile everything:

```bash
make re
```

---

## Usage

```bash
./philo number_of_philosophers time_to_die time_to_eat time_to_sleep [number_of_times_each_philosopher_must_eat]
```

### Example

```bash
./philo 5 800 200 200
```

This launches:

* 5 philosophers
* time_to_die = 800 ms
* time_to_eat = 200 ms
* time_to_sleep = 200 ms

Optional argument example:

```bash
./philo 5 800 200 200 7
```

The simulation stops once every philosopher has eaten at least 7 times.

---

## Core Concepts

### Threads

Each philosopher is represented by an independent POSIX thread created using `pthread_create`.

### Mutexes

Forks are protected using mutexes to prevent multiple philosophers from using the same fork simultaneously.

Additional mutexes are used to:

* Protect shared simulation state
* Prevent overlapping console output

### Deadlock Prevention

To reduce the risk of deadlocks:

* Even-numbered philosophers pick up the right fork first
* Odd-numbered philosophers pick up the left fork first

This breaks circular waiting conditions.

### Monitoring

The main thread continuously monitors:

* Philosopher death conditions
* Meal completion conditions

The simulation stops when:

* A philosopher dies
* All philosophers have eaten enough meals (if specified)

---

## Example Output

```txt
0 1 has taken a fork
0 1 has taken a fork
0 1 is eating
200 1 is sleeping
400 1 is thinking
```

---

## Resources

### Documentation

* POSIX Threads (pthreads):
  https://man7.org/linux/man-pages/man7/pthreads.7.html

* Mutex documentation:
  https://man7.org/linux/man-pages/man3/pthread_mutex_lock.3p.html

* gettimeofday:
  https://man7.org/linux/man-pages/man2/gettimeofday.2.html

### Concurrency Concepts

* Dining Philosophers Problem:
  https://en.wikipedia.org/wiki/Dining_philosophers_problem

* Deadlocks:
  https://en.wikipedia.org/wiki/Deadlock

### AI Usage

AI tools were used during the development process to:

* Clarify threading and mutex concepts
* Review parsing logic and project structure
* Discuss synchronization strategies
* Improve understanding of race conditions and deadlock prevention
* Refactor and validate parts of the implementation

All generated code and explanations were reviewed, tested, and rewritten where necessary to ensure full understanding of the implementation.

