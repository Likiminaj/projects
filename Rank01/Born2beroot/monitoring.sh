# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    monitoring.sh                                      :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/06/21 21:04:00 by lraghave          #+#    #+#              #
#    Updated: 2025/06/21 21:05:56 by lraghave         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

#!/bin/bash
# System Architecture
arch=$(uname -a)

# Number of Physical & Virtual Processors
cores=$(lscpu | grep "^Core(s) per socket" | awk '{print $4}')
threads=$(lscpu | grep "^Thread(s) per core" | awk '{print $4}')
sockets=$(lscpu | grep "^Socket(s)" | awk '{print $2}')
pCPU=$((sockets * threads * cores))
vCPU=$(nproc) 

# Available RAM & it's utilisation rate
availRam=$(free --mega | awk '$1 == "Mem:" {print $2}')
usedRam=$(free --mega | awk '$1=="Mem:" {print $3}')
utilRam=$(free --mega | awk '$1=="Mem:" {printf("%.2f%%", $3/$2*100)}')

# Available storage & it's utilisation rate
availDisk=$(df -BG | grep "^/dev/" | awk '{sum_availDisk += $2} END {print sum_availDisk}')
usedDisk=$(df -BG | grep "^/dev/" | awk '{sum_usedDisk += $3} END {print sum_usedDisk}')
utilDisk=$(df -BG | grep "^/dev/" | awk '{s1 += $3} {s2 += $2} END {printf("%0.2f%%", s1/s2*100)}')

# CPU utilisation rate
utilCpu=$(mpstat 1 1 | awk '$1 == "Average:" {usage = 100 - $12} END {print usage "%"}')

# Date and Time of last reboot
boot=$(who -b | awk '{print $3, $4}')

# Check if the LVM is active or not
lvm=$(if [ $(lsblk -l | grep lvm | wc -l) -gt 0 ]; then echo yes; else echo no; fi)

# Active TCP connection
estabTcp=$(ss -t | grep ESTAB | wc -l)

# Number of user
users=$(users | wc -w)

# IPv4 and Mac Address
ipAddr=$(hostname -I)
macAddr=$(ip link | grep ether | awk '{print $2}')

# Number of commands with sudo
sudoCmds=$(journalctl _COMM=sudo | grep COMMAND | wc -l)

# Broadcast
wall << EOF 
#Architecture: $arch
#CPU physical : $pCPU
#vCPU : $vCPU
#Memory Usage: $availRam/$usedRam MB ($utilRam)
#Disk Usage: $usedDisk/$availDisk Gb ($utilDisk)
#CPU load: $utilCpu
#Last boot: $boot
#LVM use: $lvm
#Connections TCP : $estabTcp ESTABLISHED
#User log: $users
#Network: IP $ipAddr ($macAddr)
#Sudo : $sudoCmds cmd
EOF
