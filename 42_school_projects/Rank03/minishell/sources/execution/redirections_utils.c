/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   redirections_utils.c                               :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/20 14:57:19 by chlpesty          #+#    #+#             */
/*   Updated: 2026/03/20 16:26:44 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

void	setup_heredoc_term(struct termios *saved);
void	heredoc_child(int *fd, char *delimiter, int line_count);
void	read_heredoc_lines(int write_fd, char *delimiter, int lc);
void	heredoc_stop_message(int line_count, char *delimiter);

/* Saves terminal settings and disables control char echo (^C, ^\). */
void	setup_heredoc_term(struct termios *saved)
{
	struct termios	term;

	tcgetattr(STDIN_FILENO, saved);
	term = *saved;
	term.c_lflag &= ~ECHOCTL;
	tcsetattr(STDIN_FILENO, TCSANOW, &term);
}

/* Child process: sets signals, reads heredoc lines, writes to pipe. */
void	heredoc_child(int *fd, char *delimiter, int line_count)
{
	close(fd[0]);
	ft_heredoc_signals();
	read_heredoc_lines(fd[1], delimiter, line_count);
	close(fd[1]);
	exit(0);
}

/* Reads lines from stdin until delimiter, writes to pipe fd. */
void	read_heredoc_lines(int write_fd, char *delimiter, int lc)
{
	char	*line;
	int		len;

	len = ft_strlen(delimiter);
	while (1)
	{
		write(1, "> ", 2);
		line = get_next_line(0);
		if (!line)
		{
			heredoc_stop_message(lc, delimiter);
			break ;
		}
		if (ft_strncmp(line, delimiter, len) == 0 && line[len] == '\n')
		{
			free(line);
			break ;
		}
		write(write_fd, line, ft_strlen(line));
		free(line);
		lc++;
	}
}

/* Prints heredoc EOF warning with line number and expected delimiter. */
void	heredoc_stop_message(int line_count, char *delimiter)
{
	write(1, "\n", 1);
	ft_putstr_fd("minishell: warning: here-document at line ", 2);
	ft_putnbr_fd(line_count, 2);
	ft_putstr_fd(" delimited by end-of-file (wanted `", 2);
	ft_putstr_fd(delimiter, 2);
	ft_putendl_fd("')", 2);
}
