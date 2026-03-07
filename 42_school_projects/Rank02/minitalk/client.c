/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   client.c                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/07 16:03:56 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/21 13:21:34 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include <unistd.h>
#include <signal.h>
#include <stdlib.h>
#include "libft/libft.h"

// prototype(s)
static void	ft_send_signal(int uid, unsigned char c);
static void	ft_print_error(void);

int	main(int argc, char **argv)
{
	int	pid;
	int	i;

	if (argc != 3)
	{
		ft_printf("Usage: %s <pid> <message>\n", argv[0]);
		exit (1);
	}
	pid = ft_atoi(argv[1]);
	if (pid <= 0 || pid > 4194303)
	{
		ft_printf("Bad <pid>\n");
		exit (1);
	}
	i = 0;
	while (argv[2][i])
	{
		ft_send_signal(pid, (unsigned char)argv[2][i]);
		i++;
	}
	ft_send_signal(pid, '\0');
	return (0);
}

static void	ft_send_signal(int pid, unsigned char c)
{
	int				i;
	unsigned char	temp;

	i = 8;
	while (i > 0)
	{
		i --;
		temp = c >> i;
		if (temp % 2 == 0)
		{
			if (kill(pid, SIGUSR2) == -1)
				return (ft_print_error());
		}
		else
		{
			if (kill(pid, SIGUSR1) == -1)
				return (ft_print_error());
		}
		usleep(2000);
	}
}

static void	ft_print_error(void)
{
	ft_printf("Signal was not received by server; likely server down");
}
