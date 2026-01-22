/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   server.c                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/07 16:03:56 by lraghave          #+#    #+#             */
/*   Updated: 2025/11/21 13:27:09 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include <unistd.h>
#include <signal.h>
#include <stdlib.h>
#include "libft/libft.h"

// prototype(s)
static void	handle_signal(int signal, siginfo_t *info, void *context);

int	main(int argc, char **argv)
{
	struct sigaction	sa;

	(void)argv;
	if (argc != 1)
	{
		ft_printf("Bad server startup\n");
		exit (0);
	}
	ft_printf("%d\n", getpid());
	sa.sa_sigaction = handle_signal;
	sa.sa_flags = SA_SIGINFO;
	sigemptyset(&sa.sa_mask);
	sigaction(SIGUSR1, &sa, NULL);
	sigaction(SIGUSR2, &sa, NULL);
	while (1)
		pause();
	return (0);
}

static void	handle_signal(int signal, siginfo_t *info, void *context)
{
	static unsigned char	c;
	static int				bit_index;
	static pid_t			current_client;

	(void)context;
	if (current_client != info->si_pid && current_client != 0)
		return ;
	if (current_client == 0)
		current_client = info->si_pid;
	c |= (signal == SIGUSR1);
	bit_index++;
	if (bit_index == 8)
	{
		if (c == '\0')
		{
			write(1, "\n", 1);
			current_client = 0;
		}
		else
			write(1, &c, 1);
		bit_index = 0;
		c = 0;
	}
	else
		c <<= 1;
}
