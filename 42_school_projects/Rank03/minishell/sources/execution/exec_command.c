/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   exec_command.c                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/04 16:01:31 by chlpesty          #+#    #+#             */
/*   Updated: 2026/03/20 15:35:18 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

void	exec_ext_command(char **command, char **envp);
void	exec_command_child(t_ast *ast, t_env *env);
int		handle_child_status(int status);
int		handle_redirections(t_redirect *redirects, int line_count);
void	redir_err(t_redirect *current);

/* Execute in a child process an external command given by user. */
void	exec_ext_command(char **command, char **envp)
{
	char		*path;
	struct stat	st;

	if (!command || !command[0])
		exit(0);
	path = command_path(command[0], envp);
	if (!path)
	{
		ft_putstr_fd(command[0], 2);
		ft_putendl_fd(": command not found", 2);
		exit(127);
	}
	if (stat(path, &st) == 0 && S_ISDIR(st.st_mode))
	{
		ft_putstr_fd(command[0], 2);
		ft_putendl_fd(": Is a directory", 2);
		free(path);
		exit(126);
	}
	if (execve(path, command, envp) == -1)
	{
		perror(command[0]);
		free(path);
		exit(126);
	}
}

/* Executes external command in child process with signal and
redirection setup. */
void	exec_command_child(t_ast *ast, t_env *env)
{
	if (handle_redirections(ast->redirects, env->line_count) == -1)
		exit(1);
	ft_restore_signals();
	exec_ext_command(ast->args, env->envp);
}

/* Converts child process exit status to shell exit code
with signal handling. */
int	handle_child_status(int status)
{
	if (WIFSIGNALED(status))
	{
		if (WTERMSIG(status) == SIGINT)
			write(1, "\n", 1);
		else if (WTERMSIG(status) == SIGQUIT)
			ft_putendl_fd("Quit (core dumped)", 1);
		return (128 + WTERMSIG(status));
	}
	if (WIFEXITED(status))
		return (WEXITSTATUS(status));
	return (1);
}

/* Handles < (input), > (output), >> (append), << (heredoc).*/
int	handle_redirections(t_redirect *redirects, int line_count)
{
	t_redirect	*current;
	int			fd;

	current = redirects;
	while (current)
	{
		if (current->type == REDIR_IN)
			fd = open(current->file, O_RDONLY);
		else if (current->type == REDIR_OUT)
			fd = open(current->file, O_WRONLY | O_CREAT | O_TRUNC, 0644);
		else if (current->type == REDIR_APPEND)
			fd = open(current->file, O_WRONLY | O_CREAT | O_APPEND, 0644);
		else if (current->type == REDIR_HEREDOC)
			fd = heredoc_handling(current->file, line_count);
		if (fd == -1)
			return (redir_err(current), -1);
		if (current->type == REDIR_IN || current->type == REDIR_HEREDOC)
			dup2(fd, STDIN_FILENO);
		else
			dup2(fd, STDOUT_FILENO);
		close(fd);
		current = current->next;
	}
	return (0);
}

/* Only prints redirection error if not a signal-interrupted heredoc. */
void	redir_err(t_redirect *current)
{
	if (current->type == REDIR_HEREDOC && g_signal)
		return ;
	ft_putstr_fd("minishell: ", 2);
	perror(current->file);
}
